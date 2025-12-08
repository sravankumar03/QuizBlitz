import { Router } from "express";
import { QuizService } from "../../../core/application/services/quiz.service";
import { z } from "zod";

const generateSchema = z.object({
  topic: z.string().min(3),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  numQuestions: z.number().int().min(1).max(20),
});

const createSchema = z.object({
  title: z.string().min(3),
  topic: z.string().min(2),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  questions: z.array(z.object({
    prompt: z.string().min(5),
    options: z.array(z.string().min(1)).length(4),
    correctIndex: z.number().int().min(0).max(3),
  })).min(1).max(50),
});

export const buildQuizRouter = (quizService: QuizService) => {
  const router = Router();

  // AI-generated quiz
  router.post("/generate", async (req, res, next) => {
    try {
      const payload = generateSchema.parse(req.body);
      const quiz = await quizService.generateAndStore(payload);
      res.status(201).json(quiz);
    } catch (error) {
      next(error);
    }
  });

  // Manual quiz creation
  router.post("/create", async (req, res, next) => {
    try {
      const payload = createSchema.parse(req.body);
      const quiz = await quizService.create(payload);
      res.status(201).json(quiz);
    } catch (error) {
      next(error);
    }
  });

  router.get("/", async (_req, res, next) => {
    try {
      const quizzes = await quizService.list();
      res.json(quizzes);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      await quizService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
};

