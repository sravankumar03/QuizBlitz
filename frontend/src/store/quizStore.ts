import { create } from "zustand";

export type QuizOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  order: number;
  options: QuizOption[];
  correctIndex: number;
};

export type Quiz = {
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  questions: QuizQuestion[];
};

type QuizState = {
  quizzes: Quiz[];
  selectedQuiz?: Quiz;
  setQuizzes: (value: Quiz[] | ((prev: Quiz[]) => Quiz[])) => void;
  setSelectedQuiz: (quiz?: Quiz) => void;
};

export const useQuizStore = create<QuizState>((set) => ({
  quizzes: [],
  setQuizzes: (value) =>
    set((state) => ({
      quizzes: typeof value === "function" ? value(state.quizzes) : value,
    })),
  setSelectedQuiz: (selectedQuiz) => set({ selectedQuiz }),
}));

