import { QuizEntity } from "../domain/quiz";

export interface QuizRepositoryPort {
  save(quiz: QuizEntity): Promise<QuizEntity>;
  findById(id: string): Promise<QuizEntity | null>;
  list(): Promise<QuizEntity[]>;
  delete(id: string): Promise<void>;
}

