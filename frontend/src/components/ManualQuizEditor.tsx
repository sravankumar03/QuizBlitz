import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { createManualQuiz, listQuizzes } from "../services/api";
import { useQuizStore } from "../store/quizStore";

type QuestionForm = {
    prompt: string;
    options: string[];
    correctIndex: number;
};

const emptyQuestion = (): QuestionForm => ({
    prompt: "",
    options: ["", "", "", ""],
    correctIndex: 0,
});

export function ManualQuizEditor() {
    const { setQuizzes } = useQuizStore();
    const [title, setTitle] = useState("");
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
    const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()]);
    const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleAddQuestion = () => {
        setQuestions([...questions, emptyQuestion()]);
    };

    const handleRemoveQuestion = (index: number) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const handleQuestionChange = (index: number, field: "prompt" | "correctIndex", value: string | number) => {
        const updated = [...questions];
        if (field === "prompt") {
            updated[index].prompt = value as string;
        } else if (field === "correctIndex") {
            updated[index].correctIndex = value as number;
        }
        setQuestions(updated);
    };

    const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
        const updated = [...questions];
        updated[qIndex].options[optIndex] = value;
        setQuestions(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!title.trim() || !topic.trim()) {
            setErrorMsg("Please fill in title and topic");
            setStatus("error");
            return;
        }

        const invalidQuestion = questions.find(
            q => !q.prompt.trim() || q.options.some(opt => !opt.trim())
        );
        if (invalidQuestion) {
            setErrorMsg("Please fill in all question prompts and options");
            setStatus("error");
            return;
        }

        setStatus("saving");
        setErrorMsg("");

        try {
            await createManualQuiz({
                title: title.trim(),
                topic: topic.trim(),
                difficulty,
                questions: questions.map(q => ({
                    prompt: q.prompt.trim(),
                    options: q.options.map(o => o.trim()),
                    correctIndex: q.correctIndex,
                })),
            });

            // Refresh quiz list
            const updatedQuizzes = await listQuizzes();
            setQuizzes(updatedQuizzes);

            // Reset form
            setTitle("");
            setTopic("");
            setDifficulty("medium");
            setQuestions([emptyQuestion()]);
            setStatus("success");

            setTimeout(() => setStatus("idle"), 3000);
        } catch (error) {
            console.error("Failed to create quiz", error);
            setErrorMsg("Failed to create quiz. Please try again.");
            setStatus("error");
        }
    };

    const difficulties = [
        { value: "easy", icon: "🌱", label: "Easy", color: "from-green-500 to-emerald-500" },
        { value: "medium", icon: "⚡", label: "Medium", color: "from-yellow-500 to-orange-500" },
        { value: "hard", icon: "🔥", label: "Hard", color: "from-red-500 to-pink-500" },
    ] as const;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    ✏️ Manual Quiz Editor
                </CardTitle>
                <CardDescription>Create a quiz manually by adding your own questions</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Quiz Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Quiz Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. JavaScript Fundamentals"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="topic">Topic</Label>
                            <Input
                                id="topic"
                                placeholder="e.g. javascript"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Difficulty Selector */}
                    <div className="space-y-2">
                        <Label>Difficulty</Label>
                        <div className="flex gap-2">
                            {difficulties.map((d) => (
                                <button
                                    key={d.value}
                                    type="button"
                                    onClick={() => setDifficulty(d.value)}
                                    className={`
                                        flex-1 py-2 px-3 rounded-lg font-medium text-white text-sm
                                        transition-all duration-200
                                        ${difficulty === d.value
                                            ? `bg-gradient-to-r ${d.color} ring-2 ring-white shadow-lg scale-105`
                                            : 'bg-slate-700 hover:bg-slate-600'
                                        }
                                    `}
                                >
                                    {d.icon} {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-lg">Questions ({questions.length})</Label>
                            <Button
                                type="button"
                                onClick={handleAddQuestion}
                                variant="outline"
                                className="text-sm"
                            >
                                ➕ Add Question
                            </Button>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {questions.map((question, qIndex) => (
                                <div
                                    key={qIndex}
                                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-purple-400">
                                            Question {qIndex + 1}
                                        </span>
                                        {questions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveQuestion(qIndex)}
                                                className="text-red-400 hover:text-red-300 text-sm"
                                            >
                                                🗑️ Remove
                                            </button>
                                        )}
                                    </div>

                                    <Input
                                        placeholder="Enter your question..."
                                        value={question.prompt}
                                        onChange={(e) => handleQuestionChange(qIndex, "prompt", e.target.value)}
                                        className="bg-slate-900/50"
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {question.options.map((option, optIndex) => (
                                            <div key={optIndex} className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuestionChange(qIndex, "correctIndex", optIndex)}
                                                    className={`
                                                        w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0
                                                        transition-all duration-200
                                                        ${question.correctIndex === optIndex
                                                            ? 'bg-green-500 text-white ring-2 ring-green-300'
                                                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                                        }
                                                    `}
                                                    title={question.correctIndex === optIndex ? "Correct answer" : "Click to set as correct"}
                                                >
                                                    {String.fromCharCode(65 + optIndex)}
                                                </button>
                                                <Input
                                                    placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                                    value={option}
                                                    onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                                                    className={`flex-1 bg-slate-900/50 ${question.correctIndex === optIndex ? 'border-green-500/50' : ''}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        💡 Click the letter button to mark the correct answer
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {status === "error" && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                            ❌ {errorMsg}
                        </div>
                    )}

                    {/* Success Message */}
                    {status === "success" && (
                        <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 text-sm animate-fade-in">
                            ✅ Quiz created successfully!
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={status === "saving"}
                    >
                        {status === "saving" ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span>
                                Saving Quiz...
                            </>
                        ) : (
                            <>💾 Save Quiz</>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
