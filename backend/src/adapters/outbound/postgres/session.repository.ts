import { SessionRepositoryPort } from "../../../core/ports/session-repository.port";
import { prisma } from "../../../infrastructure/db/prismaClient";
import { SessionEntity, SessionParticipantEntity, ParticipantAnswerEntity } from "../../../core/domain/session";
import { randomBytes } from "crypto";

const mapSession = (session: any): SessionEntity => ({
  id: session.id,
  sessionCode: session.sessionCode,
  quizId: session.quizId,
  isActive: session.isActive,
  currentQuestion: session.currentQuestion ?? undefined,
});

const mapParticipant = (participant: any): SessionParticipantEntity => ({
  id: participant.id,
  sessionId: participant.sessionId,
  name: participant.name,
  score: participant.score,
});

const generateCode = () => randomBytes(2).toString("hex").toUpperCase();

export class PrismaSessionRepository implements SessionRepositoryPort {
  async create(quizId: string): Promise<SessionEntity> {
    const session = await prisma.session.create({
      data: {
        quizId,
        sessionCode: generateCode(),
      },
    });
    return mapSession(session);
  }

  async start(sessionId: string): Promise<SessionEntity> {
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: true, currentQuestion: 0 },
    });
    return mapSession(session);
  }

  async end(sessionId: string): Promise<SessionEntity> {
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false, endedAt: new Date() },
    });
    return mapSession(session);
  }

  findByCode(code: string) {
    return prisma.session.findUnique({ where: { sessionCode: code } }).then((session) => (session ? mapSession(session) : null));
  }

  findById(id: string) {
    return prisma.session.findUnique({ where: { id } }).then((session) => (session ? mapSession(session) : null));
  }

  async addParticipant(sessionId: string, name: string): Promise<SessionParticipantEntity> {
    const participant = await prisma.sessionParticipant.create({
      data: { sessionId, name },
    });
    return mapParticipant(participant);
  }

  async saveAnswer(input: {
    sessionId: string;
    participantId: string;
    questionId: string;
    optionId: string;
    isCorrect: boolean;
  }): Promise<ParticipantAnswerEntity> {
    const answer = await prisma.participantAnswer.upsert({
      where: {
        sessionId_participantId_questionId: {
          sessionId: input.sessionId,
          participantId: input.participantId,
          questionId: input.questionId,
        },
      },
      update: {
        optionId: input.optionId,
        isCorrect: input.isCorrect,
      },
      create: {
        sessionId: input.sessionId,
        participantId: input.participantId,
        questionId: input.questionId,
        optionId: input.optionId,
        isCorrect: input.isCorrect,
      },
    });
    return {
      id: answer.id,
      sessionId: answer.sessionId,
      participantId: answer.participantId,
      questionId: answer.questionId,
      optionId: answer.optionId,
      isCorrect: answer.isCorrect,
    };
  }

  async updateScore(participantId: string, delta: number): Promise<SessionParticipantEntity> {
    const participant = await prisma.sessionParticipant.update({
      where: { id: participantId },
      data: { score: { increment: delta } },
    });
    return mapParticipant(participant);
  }

  async getLeaderboard(sessionId: string): Promise<SessionParticipantEntity[]> {
    const participants = await prisma.sessionParticipant.findMany({
      where: { sessionId },
      orderBy: { score: "desc" },
    });
    return participants.map(mapParticipant);
  }
}

