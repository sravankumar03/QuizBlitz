import axios from "axios";
import type { Quiz } from "../store/quizStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
});

export const generateQuiz = async (payload: { topic: string; difficulty: string; numQuestions: number }) => {
  const { data } = await api.post<Quiz>("/quiz/generate", payload);
  return data;
};

export const listQuizzes = async () => {
  const { data } = await api.get<Quiz[]>("/quiz");
  return data;
};

export const createSession = async (quizId: string) => {
  const { data } = await api.post<{ id: string; sessionCode: string }>("/session/create", { quizId });
  return data;
};

export const startSession = async (sessionId: string) => {
  const { data } = await api.post(`/session/${sessionId}/start`);
  return data;
};

export const endSession = async (sessionId: string) => {
  const { data } = await api.post(`/session/${sessionId}/end`);
  return data;
};

export const deleteQuiz = async (quizId: string) => {
  await api.delete(`/quiz/${quizId}`);
};

export interface ManualQuizPayload {
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questions: {
    prompt: string;
    options: string[];
    correctIndex: number;
  }[];
}

export const createManualQuiz = async (payload: ManualQuizPayload) => {
  const { data } = await api.post<Quiz>("/quiz/create", payload);
  return data;
};
