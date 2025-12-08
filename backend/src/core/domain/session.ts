export interface SessionEntity {
  id: string;
  sessionCode: string;
  quizId: string;
  isActive: boolean;
  currentQuestion?: number;
}

export interface SessionParticipantEntity {
  id: string;
  sessionId: string;
  name: string;
  score: number;
}

export interface ParticipantAnswerEntity {
  id: string;
  participantId: string;
  sessionId: string;
  questionId: string;
  optionId: string;
  isCorrect: boolean;
}

