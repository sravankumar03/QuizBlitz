import express from "express";
import cors from "cors";
import { buildQuizRouter } from "../../adapters/inbound/http/quiz.controller";
import { buildSessionRouter } from "../../adapters/inbound/http/session.controller";
import { QuizService } from "../../core/application/services/quiz.service";
import { SessionService } from "../../core/application/services/session.service";

export const buildApp = (deps: { quizService: QuizService; sessionService: SessionService }) => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/quiz", buildQuizRouter(deps.quizService));
  app.use("/session", buildSessionRouter(deps.sessionService));

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err?.status || 500;
    res.status(status).json({ message: err?.message ?? "Internal server error" });
  });

  return app;
};

