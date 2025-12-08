import { Prisma } from "@prisma/client";
import { QuizEntity } from "../../../core/domain/quiz";
import { QuizRepositoryPort } from "../../../core/ports/quiz-repository.port";
import { prisma } from "../../../infrastructure/db/prismaClient";

const quizSelect = {
  id: true,
  title: true,
  topic: true,
  difficulty: true,
  questions: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      prompt: true,
      order: true,
      options: {
        select: {
          id: true,
          text: true,
          isCorrect: true,
        },
      },
    },
  },
} satisfies Prisma.QuizSelect;

const mapQuiz = (quiz: Prisma.QuizGetPayload<{ select: typeof quizSelect }>): QuizEntity => ({
  id: quiz.id,
  title: quiz.title,
  topic: quiz.topic,
  difficulty: quiz.difficulty as QuizEntity["difficulty"],
  questions: quiz.questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    order: question.order,
    options: question.options.map((option, index) => ({
      id: option.id,
      text: option.text,
      isCorrect: option.isCorrect,
    })),
    correctIndex: question.options.findIndex((opt) => opt.isCorrect),
  })),
});

export class PrismaQuizRepository implements QuizRepositoryPort {
  async save(quiz: QuizEntity): Promise<QuizEntity> {
    const created = await prisma.quiz.create({
      data: {
        title: quiz.title,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        questions: {
          create: quiz.questions.map((question, index) => ({
            prompt: question.prompt,
            order: index,
            options: {
              create: question.options.map((option) => ({
                text: option.text,
                isCorrect: option.isCorrect,
              })),
            },
          })),
        },
      },
      select: quizSelect,
    });
    return mapQuiz(created);
  }

  async findById(id: string): Promise<QuizEntity | null> {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: quizSelect,
    });
    return quiz ? mapQuiz(quiz) : null;
  }

  async list(): Promise<QuizEntity[]> {
    const quizzes = await prisma.quiz.findMany({
      select: quizSelect,
      orderBy: { createdAt: "desc" },
    });
    return quizzes.map(mapQuiz);
  }

  async delete(id: string): Promise<void> {
    await prisma.quiz.delete({
      where: { id },
    });
  }
}

