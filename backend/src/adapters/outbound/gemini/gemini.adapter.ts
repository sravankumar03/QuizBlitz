import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuid } from "uuid";
import { GeneratedQuizInput, QuizEntity } from "../../../core/domain/quiz";
import { QuizGeneratorPort } from "../../../core/ports/gemini.port";

const DEFAULT_MODEL = "gemini-1.5-flash";

export class GeminiQuizGenerator implements QuizGeneratorPort {
  private readonly client?: GoogleGenerativeAI;

  constructor(private readonly apiKey?: string) {
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateQuiz(payload: GeneratedQuizInput): Promise<QuizEntity> {
    if (!this.client) {
      return this.mockQuiz(payload);
    }

    const model = this.client.getGenerativeModel({ model: DEFAULT_MODEL });
    const prompt = [
      "You are an assistant that writes multiple choice quizzes in JSON.",
      `Topic: ${payload.topic}`,
      `Difficulty: ${payload.difficulty}`,
      `Number of questions: ${payload.numQuestions}`,
      "Respond with pure JSON matching { title, topic, difficulty, questions:[{ prompt, options: string[4], correctIndex:number }]}",
    ].join("\n");

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    const parsed = JSON.parse(text);
    const quiz: QuizEntity = {
      id: uuid(),
      title: parsed.title ?? `${payload.topic} quiz`,
      topic: payload.topic,
      difficulty: payload.difficulty,
      questions: parsed.questions.map((q: any, index: number) => ({
        id: uuid(),
        prompt: q.prompt,
        order: index,
        options: q.options.map((opt: string, optIndex: number) => ({
          id: uuid(),
          text: opt,
          isCorrect: optIndex === q.correctIndex,
        })),
        correctIndex: q.correctIndex,
      })),
    };

    return quiz;
  }

  private mockQuiz(payload: GeneratedQuizInput): QuizEntity {
    return {
      id: uuid(),
      title: `${payload.topic} quiz`,
      topic: payload.topic,
      difficulty: payload.difficulty,
      questions: Array.from({ length: payload.numQuestions }).map((_, index) => ({
        id: uuid(),
        prompt: `Sample question ${index + 1} about ${payload.topic}?`,
        order: index,
        options: Array.from({ length: 4 }).map((__, optIndex) => ({
          id: uuid(),
          text: `Option ${optIndex + 1}`,
          isCorrect: optIndex === 0,
        })),
        correctIndex: 0,
      })),
    };
  }
}

