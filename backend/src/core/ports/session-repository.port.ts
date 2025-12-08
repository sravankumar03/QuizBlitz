import { ParticipantAnswerEntity, SessionEntity, SessionParticipantEntity } from "../domain/session";

export interface SessionRepositoryPort {
  create(quizId: string): Promise<SessionEntity>;
  start(sessionId: string): Promise<SessionEntity>;
  end(sessionId: string): Promise<SessionEntity>;
  findByCode(code: string): Promise<SessionEntity | null>;
  findById(id: string): Promise<SessionEntity | null>;
  addParticipant(sessionId: string, name: string): Promise<SessionParticipantEntity>;
  saveAnswer(input: {
    sessionId: string;
    participantId: string;
    questionId: string;
    optionId: string;
    isCorrect: boolean;
  }): Promise<ParticipantAnswerEntity>;
  updateScore(participantId: string, delta: number): Promise<SessionParticipantEntity>;
  getLeaderboard(sessionId: string): Promise<SessionParticipantEntity[]>;
}

