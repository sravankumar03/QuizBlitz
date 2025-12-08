import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { generateQuiz } from "../services/api";
import { useQuizStore } from "../store/quizStore";

const difficulties = [
    {
        label: "Easy",
        value: "easy",
        icon: "🌱",
        description: "Basic concepts",
        color: "from-green-500 to-emerald-600",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/50",
        textColor: "text-green-400"
    },
    {
        label: "Medium",
        value: "medium",
        icon: "⚡",
        description: "Moderate challenge",
        color: "from-yellow-500 to-orange-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/50",
        textColor: "text-yellow-400"
    },
    {
        label: "Hard",
        value: "hard",
        icon: "🔥",
        description: "Expert level",
        color: "from-red-500 to-rose-600",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/50",
        textColor: "text-red-400"
    },
];

export function QuizGenerator() {
    const { setQuizzes } = useQuizStore();
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("medium");
    const [numQuestions, setNumQuestions] = useState(5);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [generatedQuiz, setGeneratedQuiz] = useState<any | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus("loading");
        setMessage("");
        try {
            const quiz = await generateQuiz({ topic, difficulty, numQuestions });
            setGeneratedQuiz(quiz);
            setQuizzes((prev) => {
                const existing = Array.isArray(prev) ? prev : [];
                return [quiz, ...existing];
            });
            setStatus("success");
            setMessage("Quiz generated successfully!");
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Failed to generate quiz");
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-6">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
                        ✨
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Generate Quiz with AI</CardTitle>
                        <CardDescription className="text-slate-400 text-base">Create MCQs on any topic in seconds</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 px-8 pb-8">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Topic Input */}
                    <div className="space-y-2">
                        <Label htmlFor="topic" className="text-sm font-medium text-slate-300">Topic</Label>
                        <div className="relative">
                            <Input
                                id="topic"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="What do you want to quiz about?"
                                className="h-14 pl-5 pr-5 bg-slate-900/60 border border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl text-white placeholder:text-slate-500 transition-all"
                                required
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">e.g., Photosynthesis, World War II, Python Programming</p>
                    </div>

                    {/* Difficulty Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-300">Difficulty Level</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {difficulties.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => setDifficulty(item.value)}
                                    className={`
                                        relative p-4 rounded-xl text-left transition-all duration-300 group
                                        ${difficulty === item.value
                                            ? `bg-gradient-to-br ${item.color} shadow-lg shadow-${item.value === 'easy' ? 'green' : item.value === 'medium' ? 'yellow' : 'red'}-500/20 ring-2 ring-white/20 scale-[1.02]`
                                            : `${item.bgColor} border ${item.borderColor} hover:border-opacity-100 hover:scale-[1.01]`
                                        }
                                    `}
                                >
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <span className={`text-2xl ${difficulty === item.value ? '' : 'group-hover:scale-110'} transition-transform`}>
                                            {item.icon}
                                        </span>
                                        <span className={`font-semibold ${difficulty === item.value ? 'text-white' : item.textColor}`}>
                                            {item.label}
                                        </span>
                                        <span className={`text-xs ${difficulty === item.value ? 'text-white/70' : 'text-slate-500'}`}>
                                            {item.description}
                                        </span>
                                    </div>
                                    {difficulty === item.value && (
                                        <div className="absolute top-2 right-2">
                                            <span className="text-white text-sm">✓</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Number of Questions */}
                    <div className="space-y-3">
                        <Label htmlFor="numQuestions" className="text-sm font-medium text-slate-300">Number of Questions</Label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setNumQuestions(Math.max(1, numQuestions - 1))}
                                className="w-12 h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 text-slate-300 text-xl font-bold transition-all hover:scale-105 active:scale-95"
                            >
                                −
                            </button>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                id="numQuestions"
                                value={numQuestions}
                                onChange={(e) => {
                                    const inputValue = e.target.value;
                                    // Allow empty or numeric input while typing
                                    if (inputValue === '' || /^\d+$/.test(inputValue)) {
                                        const value = parseInt(inputValue) || 0;
                                        if (value <= 20) {
                                            setNumQuestions(value === 0 ? 0 : value);
                                        }
                                    }
                                }}
                                onBlur={(e) => {
                                    // Validate on blur - ensure valid range
                                    const value = parseInt(e.target.value) || 1;
                                    setNumQuestions(Math.min(20, Math.max(1, value)));
                                }}
                                className="flex-1 h-12 rounded-xl bg-slate-900/60 border border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xl font-bold text-white text-center transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setNumQuestions(Math.min(20, numQuestions + 1))}
                                className="w-12 h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 text-slate-300 text-xl font-bold transition-all hover:scale-105 active:scale-95"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 text-center">Enter a number between 1-20</p>
                    </div>

                    {/* Generate Button with Micro-Animation */}
                    <Button
                        type="submit"
                        className="w-full h-16 text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_4px_20px_rgba(139,92,246,0.4)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.5)] rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        size="lg"
                        disabled={status === "loading" || !topic}
                    >
                        {status === "loading" ? (
                            <span className="flex items-center gap-3">
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Generating with AI...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <span className="text-xl">✨</span>
                                Generate Quiz
                            </span>
                        )}
                    </Button>

                    {/* Status Message */}
                    {message && (
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${status === "error"
                            ? "bg-red-500/10 border border-red-500/30 text-red-400"
                            : "bg-green-500/10 border border-green-500/30 text-green-400"
                            }`}>
                            <span>{status === "error" ? "❌" : "✓"}</span>
                            {message}
                        </div>
                    )}
                </form>

                {/* Generated Quiz Preview */}
                {generatedQuiz && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between py-3 border-t border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                    <span className="text-green-400">✓</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{generatedQuiz.title}</h3>
                                    <p className="text-xs text-slate-500">{generatedQuiz.questions.length} questions • {difficulty}</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                                Ready to use
                            </span>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {generatedQuiz.questions.map((question: any, idx: number) => (
                                <div key={question.id} className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4">
                                    <p className="text-sm font-medium text-white flex items-start gap-2 mb-3">
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 text-xs shrink-0 font-bold">
                                            {idx + 1}
                                        </span>
                                        <span>{question.prompt}</span>
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                                        {question.options.map((option: any, optIdx: number) => (
                                            <div
                                                key={option.id}
                                                className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2
                                                    ${optIdx === question.correctIndex
                                                        ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                                                        : 'bg-slate-700/50 border border-slate-600/30 text-slate-300'
                                                    }
                                                `}
                                            >
                                                <span className={`font-bold ${optIdx === question.correctIndex ? 'text-green-400' : 'text-slate-400'}`}>
                                                    {String.fromCharCode(65 + optIdx)}
                                                </span>
                                                <span className="line-clamp-1">{option.text}</span>
                                                {optIdx === question.correctIndex && <span className="ml-auto">✓</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
