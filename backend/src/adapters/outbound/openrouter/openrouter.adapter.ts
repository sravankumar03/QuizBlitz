import { v4 as uuid } from "uuid";
import { GeneratedQuizInput, QuizEntity } from "../../../core/domain/quiz";
import { QuizGeneratorPort } from "../../../core/ports/gemini.port";

const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

interface OpenRouterMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export class OpenRouterQuizGenerator implements QuizGeneratorPort {
    private readonly apiKey?: string;
    private readonly baseUrl = "https://openrouter.ai/api/v1/chat/completions";

    constructor(apiKey?: string) {
        this.apiKey = apiKey;
    }

    async generateQuiz(payload: GeneratedQuizInput): Promise<QuizEntity> {
        if (!this.apiKey) {
            return this.mockQuiz(payload);
        }

        const systemPrompt = "You are an assistant that writes multiple choice quizzes in JSON. Always respond with pure JSON only, no markdown code blocks.";
        const userPrompt = [
            `Topic: ${payload.topic}`,
            `Difficulty: ${payload.difficulty}`,
            `Number of questions: ${payload.numQuestions}`,
            "Respond with pure JSON matching { title, topic, difficulty, questions:[{ prompt, options: string[4], correctIndex:number }]}",
        ].join("\n");

        const messages: OpenRouterMessage[] = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ];

        const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.HOST_URL || "http://localhost:4000",
                "X-Title": "Quiz Builder App",
            },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
        }

        const data: OpenRouterResponse = await response.json();
        let text = data.choices[0]?.message?.content || "";

        // Clean up the response - remove markdown code blocks if present
        text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

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
