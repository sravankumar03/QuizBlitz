import { Router } from "express";
import { z } from "zod";
import { SessionService } from "../../../core/application/services/session.service";

const createSchema = z.object({
  quizId: z.string().uuid(),
});

export const buildSessionRouter = (sessionService: SessionService) => {
  const router = Router();

  router.post("/create", async (req, res, next) => {
    try {
      const { quizId } = createSchema.parse(req.body);
      const session = await sessionService.createSession(quizId);
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/start", async (req, res, next) => {
    try {
      const { id } = req.params;
      const session = await sessionService.startSession(id);
      res.json(session);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/end", async (req, res, next) => {
    try {
      const { id } = req.params;
      const session = await sessionService.endSession(id);
      res.json(session);
    } catch (error) {
      next(error);
    }
  });

  return router;
};

