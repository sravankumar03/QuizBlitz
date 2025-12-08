import http from "http";
import { Server } from "socket.io";
import { env } from "./shared/env";
import { buildApp } from "./infrastructure/server/app";
import { PrismaQuizRepository } from "./adapters/outbound/postgres/quiz.repository";
import { PrismaSessionRepository } from "./adapters/outbound/postgres/session.repository";
import { OpenRouterQuizGenerator } from "./adapters/outbound/openrouter/openrouter.adapter";
import { QuizService } from "./core/application/services/quiz.service";
import { SessionService } from "./core/application/services/session.service";
import { SocketRealtimeGateway } from "./adapters/inbound/websocket/realtime.gateway";

async function bootstrap() {
  const quizRepository = new PrismaQuizRepository();
  const sessionRepository = new PrismaSessionRepository();
  const quizGenerator = new OpenRouterQuizGenerator(env.OPENROUTER_API_KEY);
  const realtimeGateway = new SocketRealtimeGateway();

  const quizService = new QuizService(quizGenerator, quizRepository);
  const sessionService = new SessionService(sessionRepository, quizRepository, realtimeGateway);

  const app = buildApp({ quizService, sessionService });
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
  realtimeGateway.setServer(io);
  realtimeGateway.bind(sessionRepository, sessionService);

  const port = Number(env.PORT);
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

