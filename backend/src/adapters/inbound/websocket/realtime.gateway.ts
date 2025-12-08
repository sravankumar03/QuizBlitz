import { Server, Socket } from "socket.io";
import { RealtimeGatewayPort } from "../../../core/ports/realtime-gateway.port";
import { QuizQuestion } from "../../../core/domain/quiz";
import { SessionParticipantEntity } from "../../../core/domain/session";
import { SessionRepositoryPort } from "../../../core/ports/session-repository.port";
import { SessionService } from "../../../core/application/services/session.service";

export class SocketRealtimeGateway implements RealtimeGatewayPort {
  private sessionRepository?: SessionRepositoryPort;
  private sessionService?: SessionService;
  private io?: Server;

  constructor(io?: Server) {
    this.io = io;
  }

  setServer(io: Server) {
    this.io = io;
  }

  bind(sessionRepository: SessionRepositoryPort, sessionService: SessionService) {
    if (!this.io) throw new Error("Socket server not initialized");
    this.sessionRepository = sessionRepository;
    this.sessionService = sessionService;
    this.io.on("connection", (socket) => {
      this.registerHandlers(socket);
    });
  }

  private registerHandlers(socket: Socket) {
    // Host joins session room
    socket.on("host:join", ({ sessionId }, callback) => {
      socket.join(sessionId);
      callback?.({ ok: true });
    });

    socket.on("participant:join", async (payload, callback) => {
      try {
        if (!this.sessionRepository) throw new Error("Gateway not ready");
        const { sessionCode, name } = payload;
        const session = await this.sessionRepository.findByCode(sessionCode);
        if (!session) throw new Error("Invalid session code");
        if (!session.isActive) throw new Error("Session inactive");

        const participant = await this.sessionRepository.addParticipant(session.id, name);
        socket.join(session.id);
        callback?.({ participantId: participant.id, sessionId: session.id });
      } catch (error) {
        callback?.({ error: (error as Error).message });
      }
    });

    socket.on("participant:answer", async (payload, callback) => {
      try {
        if (!this.sessionService) throw new Error("Gateway not ready");
        const result = await this.sessionService.handleAnswer(payload);
        callback?.({ ok: true, result });
      } catch (error) {
        callback?.({ error: (error as Error).message });
      }
    });

    socket.on("question:next", async ({ sessionId, questionIndex }, callback) => {
      try {
        if (!this.sessionService) throw new Error("Gateway not ready");
        await this.sessionService.broadcastNextQuestion(sessionId, questionIndex);
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ error: (error as Error).message });
      }
    });

    socket.on("question:reveal", async ({ sessionId, questionIndex }, callback) => {
      try {
        if (!this.sessionService) throw new Error("Gateway not ready");
        await this.sessionService.revealQuestion(sessionId, questionIndex);
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ error: (error as Error).message });
      }
    });
  }

  emitQuestion(sessionId: string, question: QuizQuestion) {
    this.io?.to(sessionId).emit("question:next", { question });
  }

  emitReveal(sessionId: string, correctIndex: number) {
    this.io?.to(sessionId).emit("question:reveal", { correctIndex });
  }

  emitLeaderboard(sessionId: string, leaderboard: SessionParticipantEntity[]) {
    // Deduplicate by name, keeping highest score
    const deduped = this.deduplicateLeaderboard(leaderboard);
    this.io?.to(sessionId).emit("leaderboard:update", deduped);
  }

  private deduplicateLeaderboard(leaderboard: SessionParticipantEntity[]): SessionParticipantEntity[] {
    const byName = new Map<string, SessionParticipantEntity>();
    for (const entry of leaderboard) {
      const existing = byName.get(entry.name);
      if (!existing || entry.score > existing.score) {
        byName.set(entry.name, entry);
      }
    }
    return Array.from(byName.values()).sort((a, b) => b.score - a.score);
  }

  emitSessionEnd(sessionId: string, summary?: {
    leaderboard: SessionParticipantEntity[];
    totalQuestions: number;
  }) {
    if (summary) {
      // Deduplicate by name, keeping highest score
      const dedupedLeaderboard = this.deduplicateLeaderboard(summary.leaderboard);
      const winner = dedupedLeaderboard[0] || null;
      this.io?.to(sessionId).emit("session:complete", {
        leaderboard: dedupedLeaderboard,
        winner,
        totalQuestions: summary.totalQuestions,
        totalParticipants: dedupedLeaderboard.length,
      });
    }
    this.io?.to(sessionId).emit("session:end");
  }
}

