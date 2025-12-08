import { GeneratedQuizInput, QuizEntity } from "../domain/quiz";

export interface QuizGeneratorPort {
  generateQuiz(payload: GeneratedQuizInput): Promise<QuizEntity>;
}

