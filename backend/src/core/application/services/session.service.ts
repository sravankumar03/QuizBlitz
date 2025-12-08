import { QuizRepositoryPort } from "../../ports/quiz-repository.port";
import { RealtimeGatewayPort } from "../../ports/realtime-gateway.port";
import { SessionRepositoryPort } from "../../ports/session-repository.port";

export class SessionService {
  constructor(
    private readonly sessionRepo: SessionRepositoryPort,
    private readonly quizRepo: QuizRepositoryPort,
    private readonly realtime: RealtimeGatewayPort
  ) { }

  async createSession(quizId: string) {
    const quiz = await this.quizRepo.findById(quizId);
    if (!quiz) throw new Error("Quiz not found");
    return this.sessionRepo.create(quizId);
  }

  async startSession(sessionId: string) {
    const session = await this.sessionRepo.start(sessionId);
    const quiz = await this.quizRepo.findById(session.quizId);
    if (!quiz) throw new Error("Quiz not found");

    const firstQuestion = quiz.questions[0];
    if (firstQuestion) {
      this.realtime.emitQuestion(session.id, firstQuestion);
    }
    return session;
  }

  async endSession(sessionId: string) {
    // Get final leaderboard before ending
    const leaderboard = await this.sessionRepo.getLeaderboard(sessionId);
    const session = await this.sessionRepo.findById(sessionId);
    let totalQuestions = 0;

    if (session) {
      const quiz = await this.quizRepo.findById(session.quizId);
      totalQuestions = quiz?.questions.length ?? 0;
    }

    const endedSession = await this.sessionRepo.end(sessionId);

    // Emit session complete with summary
    this.realtime.emitSessionEnd(sessionId, {
      leaderboard,
      totalQuestions,
    });

    return endedSession;
  }

  async revealQuestion(sessionId: string, questionIndex: number) {
    const quizSession = await this.sessionRepo.findById(sessionId);
    if (!quizSession) throw new Error("Session not found");
    const quiz = await this.quizRepo.findById(quizSession.quizId);
    if (!quiz) throw new Error("Quiz not found");
    const question = quiz.questions[questionIndex];
    if (!question) throw new Error("Question not found");
    this.realtime.emitReveal(sessionId, question.correctIndex);
  }

  async broadcastNextQuestion(sessionId: string, questionIndex: number) {
    const quizSession = await this.sessionRepo.findById(sessionId);
    if (!quizSession) throw new Error("Session not found");
    const quiz = await this.quizRepo.findById(quizSession.quizId);
    if (!quiz) throw new Error("Quiz not found");
    const question = quiz.questions[questionIndex];
    if (!question) throw new Error("Question not found");
    this.realtime.emitQuestion(sessionId, question);
  }

  async handleAnswer(params: {
    sessionId: string;
    participantId: string;
    questionId: string;
    optionId: string;
  }) {
    const session = await this.sessionRepo.findById(params.sessionId);
    if (!session || !session.isActive) throw new Error("Session inactive");
    const quiz = await this.quizRepo.findById(session.quizId);
    if (!quiz) throw new Error("Quiz missing");

    const question = quiz.questions.find((q) => q.id === params.questionId);
    if (!question) throw new Error("Question missing");
    const optionIndex = question.options.findIndex((o) => o.id === params.optionId);
    if (optionIndex === -1) throw new Error("Option missing");

    const alreadyAnswered = false; // Could be tracked in cache for throttle.
    if (alreadyAnswered) return;

    const isCorrect = question.correctIndex === optionIndex;
    await this.sessionRepo.saveAnswer({
      sessionId: params.sessionId,
      participantId: params.participantId,
      questionId: params.questionId,
      optionId: params.optionId,
      isCorrect,
    });

    if (isCorrect) {
      const participant = await this.sessionRepo.updateScore(params.participantId, 10);
      const leaderboard = await this.sessionRepo.getLeaderboard(params.sessionId);
      this.realtime.emitLeaderboard(params.sessionId, leaderboard);
      return participant;
    }
  }
}

