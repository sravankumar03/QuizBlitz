export type Difficulty = "easy" | "medium" | "hard";

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  order: number;
  correctIndex: number;
}

export interface QuizEntity {
  id: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
}

export interface GeneratedQuizInput {
  topic: string;
  difficulty: Difficulty;
  numQuestions: number;
}

