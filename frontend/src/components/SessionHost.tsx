import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { useQuizStore } from "../store/quizStore";
import { createSession, deleteQuiz, endSession, listQuizzes, startSession } from "../services/api";
import { getSocket } from "../services/socket";

type SessionInfo = {
    id: string;
    sessionCode: string;
};

export function SessionHost() {
    const { quizzes, setQuizzes, selectedQuiz, setSelectedQuiz } = useQuizStore();
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [status, setStatus] = useState<"idle" | "loading">("idle");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isStarted, setIsStarted] = useState(false);
    const [leaderboard, setLeaderboard] = useState<{ name: string; score: number }[]>([]);
    const [sessionComplete, setSessionComplete] = useState<{
        leaderboard: { name: string; score: number }[];
        winner: { name: string; score: number } | null;
        totalQuestions: number;
        totalParticipants: number;
    } | null>(null);
    const socket = useMemo(() => getSocket(), []);

    useEffect(() => {
        listQuizzes()
            .then(setQuizzes)
            .catch((error) => console.error("Failed to load quizzes", error));
    }, [setQuizzes]);

    useEffect(() => {
        socket.on("leaderboard:update", (payload) => setLeaderboard(payload));
        socket.on("session:complete", (data) => {
            setSessionComplete(data);
        });
        socket.on("session:end", () => {
            // Don't clear session state - let the summary show
            // User will click "Host New Quiz" to reset
            setIsStarted(false);
        });
        return () => {
            socket.off("leaderboard:update");
            socket.off("session:complete");
            socket.off("session:end");
        };
    }, [socket]);

    const handleCreate = async () => {
        if (!selectedQuiz) return;
        setStatus("loading");
        try {
            const newSession = await createSession(selectedQuiz.id);
            setSession(newSession);
            setIsStarted(false);
            setCurrentQuestionIndex(0);
            socket.emit("host:join", { sessionId: newSession.id });
        } catch (error) {
            console.error(error);
        } finally {
            setStatus("idle");
        }
    };

    const handleStart = async () => {
        if (!session) return;
        await startSession(session.id);
        setIsStarted(true);
        setCurrentQuestionIndex(0);
    };

    const handleNextQuestion = () => {
        if (!session || !selectedQuiz || !isStarted) return;
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex >= selectedQuiz.questions.length) return;
        setCurrentQuestionIndex(nextIndex);
        socket.emit("question:next", { sessionId: session.id, questionIndex: nextIndex });
    };

    const handleReveal = () => {
        if (!session) return;
        socket.emit("question:reveal", { sessionId: session.id, questionIndex: currentQuestionIndex });
    };

    const handleEnd = async () => {
        if (!session) return;
        await endSession(session.id);
        // Session will be cleared by session:end event after showing summary
    };

    const handleNewSession = () => {
        setSessionComplete(null);
        setSession(null);
        setLeaderboard([]);
        setIsStarted(false);
        setCurrentQuestionIndex(0);
    };

    const handleDeleteQuiz = async () => {
        if (!selectedQuiz) return;
        const confirmDelete = window.confirm(`Delete "${selectedQuiz.title}"? This action cannot be undone.`);
        if (!confirmDelete) return;

        try {
            await deleteQuiz(selectedQuiz.id);
            setSelectedQuiz(undefined);
            // Refresh quiz list
            const updatedQuizzes = await listQuizzes();
            setQuizzes(updatedQuizzes);
        } catch (error) {
            console.error("Failed to delete quiz", error);
            alert("Failed to delete quiz. It may be in use by an active session.");
        }
    };
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    📡 Host Live Session
                </CardTitle>
                <CardDescription>Select a quiz, generate a session code, and drive the real-time show.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* End-Game Summary for Host */}
                {sessionComplete ? (
                    <div className="space-y-6 animate-fade-in">
                        {/* Winner Celebration */}
                        <div className="text-center py-6">
                            <div className="text-6xl mb-4 animate-bounce">🏆</div>
                            <h2 className="text-3xl font-bold gradient-text mb-2">Quiz Complete!</h2>
                            {sessionComplete.winner && (
                                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
                                    <p className="text-lg text-yellow-400 mb-1">🎉 Winner</p>
                                    <p className="text-2xl font-bold text-white">{sessionComplete.winner.name}</p>
                                    <p className="text-yellow-300">{sessionComplete.winner.score} points</p>
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-slate-800/50 text-center">
                                <p className="text-3xl font-bold text-white">{sessionComplete.totalParticipants}</p>
                                <p className="text-sm text-slate-400">Participants</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-800/50 text-center">
                                <p className="text-3xl font-bold text-white">{sessionComplete.totalQuestions}</p>
                                <p className="text-sm text-slate-400">Questions</p>
                            </div>
                        </div>

                        {/* Full Leaderboard */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-slate-300 text-center">Final Standings</h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                {sessionComplete.leaderboard.map((player, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${index < 3 ? 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600' : 'bg-slate-800/50'
                                            }`}
                                    >
                                        <span className="w-8 text-center font-bold text-slate-400">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                        </span>
                                        <span className="flex-1 font-medium text-white">{player.name}</span>
                                        <span className="font-bold text-slate-300">{player.score} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* New Session Button */}
                        <Button
                            onClick={handleNewSession}
                            className="w-full"
                            size="lg"
                        >
                            🎯 Host New Quiz
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="quiz">Select Quiz</Label>
                            <select
                                id="quiz"
                                className="h-11 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 text-sm text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                value={selectedQuiz?.id ?? ""}
                                onChange={(e) => {
                                    const quiz = quizzes.find((q) => q.id === e.target.value);
                                    setSelectedQuiz(quiz);
                                    setCurrentQuestionIndex(0);
                                }}
                            >
                                <option value="">Choose a quiz</option>
                                {quizzes.map((quiz) => (
                                    <option key={quiz.id} value={quiz.id}>
                                        {quiz.title} ({quiz.topic}) - {quiz.questions?.length || 0} Qs • {quiz.difficulty || 'medium'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreate} disabled={!selectedQuiz || status === "loading"} className="flex-1">
                                {status === "loading" ? "Creating..." : "🎯 Create Session"}
                            </Button>
                            <Button
                                onClick={handleDeleteQuiz}
                                disabled={!selectedQuiz || !!session}
                                variant="destructive"
                                className="px-4"
                                title="Delete selected quiz"
                            >
                                🗑️
                            </Button>
                        </div>

                        {session && (
                            <div className="space-y-4 rounded-xl bg-slate-700/30 border border-slate-600 p-5 animate-fade-in">
                                {/* Session Code */}
                                <div className="text-center py-3">
                                    <p className="text-sm text-slate-400 mb-1">Session Code</p>
                                    <p className="text-4xl font-bold tracking-[0.3em] gradient-text">{session.sessionCode}</p>
                                    <p className="text-xs text-slate-500 mt-2">Share this code with participants</p>
                                </div>

                                {/* Control Buttons */}
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        onClick={handleStart}
                                        variant={isStarted ? "secondary" : "default"}
                                        disabled={isStarted}
                                        className="col-span-2"
                                    >
                                        {isStarted ? "✓ Quiz Started" : "▶️ Start Quiz"}
                                    </Button>
                                    <Button
                                        onClick={handleNextQuestion}
                                        variant="outline"
                                        disabled={!isStarted || currentQuestionIndex >= (selectedQuiz?.questions.length ?? 1) - 1}
                                    >
                                        ⏭️ Next Question
                                    </Button>
                                    <Button onClick={handleReveal} variant="ghost" disabled={!isStarted}>
                                        👁️ Reveal Answer
                                    </Button>
                                    <Button onClick={handleEnd} variant="destructive" className="col-span-2">
                                        🛑 End Session
                                    </Button>
                                </div>

                                {/* Current Question */}
                                {selectedQuiz && (
                                    <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-purple-400">
                                                Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
                                            </span>
                                            <div className="flex gap-1">
                                                {selectedQuiz.questions.map((_, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`w-2 h-2 rounded-full ${idx === currentQuestionIndex ? 'bg-purple-500' :
                                                            idx < currentQuestionIndex ? 'bg-green-500' : 'bg-slate-600'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-white">{selectedQuiz.questions[currentQuestionIndex]?.prompt}</p>
                                    </div>
                                )}

                                {/* Leaderboard */}
                                <div>
                                    <h4 className="font-bold mb-3 flex items-center gap-2">🏆 Leaderboard</h4>
                                    {(() => {
                                        // Process: deduplicate and sort by score descending
                                        const processed = leaderboard
                                            .reduce((acc, entry) => {
                                                const existing = acc.find(e => e.name === entry.name);
                                                if (!existing) {
                                                    acc.push({ ...entry });
                                                } else if (entry.score > existing.score) {
                                                    existing.score = entry.score;
                                                }
                                                return acc;
                                            }, [] as { name: string; score: number }[])
                                            .sort((a, b) => b.score - a.score);

                                        return processed.length > 0 ? (
                                            <div className="space-y-2">
                                                {processed.slice(0, 10).map((entry, idx) => (
                                                    <div
                                                        key={entry.name}
                                                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all
                                                    ${idx === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30' :
                                                                idx === 1 ? 'bg-gradient-to-r from-slate-400/20 to-slate-300/20 border border-slate-400/30' :
                                                                    idx === 2 ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-600/30' :
                                                                        'bg-slate-700/50 border border-slate-600/30'
                                                            }
                                                `}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-6 text-center">
                                                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : <span className="font-bold text-slate-400">{idx + 1}</span>}
                                                            </span>
                                                            <span className="font-medium">{entry.name}</span>
                                                        </div>
                                                        <span className={`font-bold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-orange-400' : 'text-white'}`}>
                                                            {entry.score} pts
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 text-center py-2">No answers yet.</p>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
