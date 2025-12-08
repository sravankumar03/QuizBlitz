import { QuizQuestion } from "../domain/quiz";
import { SessionParticipantEntity } from "../domain/session";

export interface RealtimeGatewayPort {
  emitQuestion(sessionId: string, question: QuizQuestion): void;
  emitReveal(sessionId: string, correctIndex: number): void;
  emitLeaderboard(sessionId: string, leaderboard: SessionParticipantEntity[]): void;
  emitSessionEnd(sessionId: string, summary?: {
    leaderboard: SessionParticipantEntity[];
    totalQuestions: number;
  }): void;
}

