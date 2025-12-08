import { Difficulty, GeneratedQuizInput, QuizEntity } from "../../domain/quiz";
import { QuizGeneratorPort } from "../../ports/gemini.port";
import { QuizRepositoryPort } from "../../ports/quiz-repository.port";
import { v4 as uuid } from "uuid";

export interface ManualQuizInput {
  title: string;
  topic: string;
  difficulty: Difficulty;
  questions: {
    prompt: string;
    options: string[];
    correctIndex: number;
  }[];
}

export class QuizService {
  constructor(
    private readonly generator: QuizGeneratorPort,
    private readonly repository: QuizRepositoryPort
  ) { }

  async generateAndStore(payload: GeneratedQuizInput): Promise<QuizEntity> {
    const quiz = await this.generator.generateQuiz(payload);
    return this.repository.save(quiz);
  }

  async create(payload: ManualQuizInput): Promise<QuizEntity> {
    const quiz: QuizEntity = {
      id: uuid(),
      title: payload.title,
      topic: payload.topic,
      difficulty: payload.difficulty,
      questions: payload.questions.map((q, index) => ({
        id: uuid(),
        prompt: q.prompt,
        order: index,
        options: q.options.map((text, optIdx) => ({
          id: uuid(),
          text,
          isCorrect: optIdx === q.correctIndex,
        })),
        correctIndex: q.correctIndex,
      })),
    };
    return this.repository.save(quiz);
  }

  async list(): Promise<QuizEntity[]> {
    return this.repository.list();
  }

  async getById(id: string): Promise<QuizEntity | null> {
    return this.repository.findById(id);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}

