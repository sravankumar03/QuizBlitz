import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { getSocket } from "../services/socket";

type QuestionPayload = {
    question: {
        id: string;
        prompt: string;
        options: { id: string; text: string }[];
        correctIndex: number;
    };
    timeLimit?: number;
};

const optionColors = [
    "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500",
    "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500",
    "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500",
    "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500",
];

// Medal colors for top 3
const medalColors = {
    gold: "#D4AF37",
    silver: "#C0C0C0",
    bronze: "#CD7F32",
};

// Avatar color palette
const avatarColors = [
    "bg-gradient-to-br from-pink-500 to-rose-500",
    "bg-gradient-to-br from-purple-500 to-indigo-500",
    "bg-gradient-to-br from-blue-500 to-cyan-500",
    "bg-gradient-to-br from-green-500 to-emerald-500",
    "bg-gradient-to-br from-orange-500 to-amber-500",
];

type ParticipantViewProps = {
    initialName?: string;
    initialSessionCode?: string;
};

export function ParticipantView({ initialName = "", initialSessionCode = "" }: ParticipantViewProps) {
    const socket = useMemo(() => getSocket(), []);
    const [name, setName] = useState(initialName);
    const [sessionCode, setSessionCode] = useState(initialSessionCode);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [question, setQuestion] = useState<QuestionPayload["question"] | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [status, setStatus] = useState("");
    const [leaderboard, setLeaderboard] = useState<{ name: string; score: number }[]>([]);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [timeExpired, setTimeExpired] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [revealedAnswerIndex, setRevealedAnswerIndex] = useState<number | null>(null);
    const [sessionComplete, setSessionComplete] = useState<{
        leaderboard: { name: string; score: number }[];
        winner: { name: string; score: number } | null;
        totalQuestions: number;
        totalParticipants: number;
    } | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        socket.on("question:next", (payload: QuestionPayload) => {
            setQuestion(payload.question);
            setHasAnswered(false);
            setSelectedOption(null);
            setStatus("");
            setShowCelebration(false);
            setIsCorrect(false);
            setTimeExpired(false);
            setRevealedAnswerIndex(null);
            if (payload.timeLimit) {
                setTimeLeft(payload.timeLimit);
            } else {
                setTimeLeft(30);
            }
        });
        socket.on("question:reveal", ({ correctIndex }) => {
            const correctLetter = String.fromCharCode(65 + correctIndex);
            setStatus(`✓ Correct answer: ${correctLetter}`);
            if (question && selectedOption) {
                const selectedIdx = question.options.findIndex(o => o.id === selectedOption);
                if (selectedIdx === correctIndex) {
                    setIsCorrect(true);
                    setShowCelebration(true);
                    setTimeout(() => setShowCelebration(false), 2000);
                }
            }
            setTimeLeft(null);
        });
        socket.on("leaderboard:update", setLeaderboard);
        socket.on("session:complete", (data) => {
            setSessionComplete(data);
        });
        return () => {
            socket.off("question:next");
            socket.off("question:reveal");
            socket.off("leaderboard:update");
            socket.off("session:complete");
        };
    }, [socket, question, selectedOption]);

    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            setTimeExpired(true);
            // Auto-reveal the correct answer when time expires
            if (question && question.correctIndex !== undefined) {
                const correctLetter = String.fromCharCode(65 + question.correctIndex);
                setRevealedAnswerIndex(question.correctIndex);
                setStatus(`⏱️ Time's up! Correct answer: ${correctLetter}`);
                // Check if user answered correctly
                if (selectedOption) {
                    const selectedIdx = question.options.findIndex(o => o.id === selectedOption);
                    if (selectedIdx === question.correctIndex) {
                        setIsCorrect(true);
                        setShowCelebration(true);
                        setTimeout(() => setShowCelebration(false), 2000);
                    }
                }
            } else {
                setStatus("⏱️ Time's up!");
            }
            return;
        }
        timerRef.current = setTimeout(() => {
            setTimeLeft(prev => prev !== null ? prev - 1 : null);
        }, 1000);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [timeLeft]);

    useEffect(() => {
        if (initialName && initialSessionCode && !participantId) {
            socket.emit("participant:join", { sessionCode: initialSessionCode, name: initialName }, (response: any) => {
                if (response?.error) {
                    setStatus(response.error);
                    return;
                }
                setParticipantId(response.participantId);
                setSessionId(response.sessionId);
                setStatus("🎮 Joined! Waiting for host to start...");
            });
        }
    }, [initialName, initialSessionCode, socket, participantId]);

    const handleJoin = () => {
        socket.emit("participant:join", { sessionCode, name }, (response: any) => {
            if (response?.error) {
                setStatus(response.error);
                return;
            }
            setParticipantId(response.participantId);
            setSessionId(response.sessionId);
            setStatus("🎮 Joined! Waiting for host to start...");
        });
    };

    const handleAnswer = (optionId: string, index: number) => {
        if (!sessionId || !participantId || !question || hasAnswered || timeExpired) return;
        setSelectedOption(optionId);
        socket.emit("participant:answer", { sessionId, participantId, questionId: question.id, optionId }, (response: any) => {
            if (response?.error) {
                setStatus(response.error);
                return;
            }
            setHasAnswered(true);
            setStatus(`✓ You selected ${String.fromCharCode(65 + index)}`);
        });
    };

    const getAvatarColor = (playerName: string) => {
        const hash = playerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return avatarColors[hash % avatarColors.length];
    };

    const getInitials = (playerName: string) => {
        return playerName.slice(0, 2).toUpperCase();
    };

    // Process leaderboard: sort by score descending and deduplicate
    const processedLeaderboard = useMemo(() => {
        const deduplicated = leaderboard.reduce((acc, entry) => {
            const existing = acc.find(e => e.name === entry.name);
            if (!existing) {
                acc.push({ ...entry });
            } else if (entry.score > existing.score) {
                existing.score = entry.score;
            }
            return acc;
        }, [] as { name: string; score: number }[]);
        return deduplicated.sort((a, b) => b.score - a.score);
    }, [leaderboard]);

    const timerProgress = timeLeft !== null ? (timeLeft / 30) * 100 : 0;
    const timerColor = timeLeft !== null && timeLeft <= 5 ? 'text-red-500' : timeLeft !== null && timeLeft <= 10 ? 'text-yellow-500' : 'text-green-500';

    // Find user's rank
    const userRank = processedLeaderboard.findIndex(e => e.name === name);
    const userInTopFive = userRank !== -1 && userRank < 5;
    const userEntry = processedLeaderboard.find(e => e.name === name);

    // Build display list: top 5 + user if outside top 5
    const displayList = [...processedLeaderboard.slice(0, 5)];
    if (userEntry && !userInTopFive) {
        displayList.push(userEntry);
    }

    return (
        <Card className="max-w-2xl mx-auto relative overflow-hidden">
            {showCelebration && (
                <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-20px',
                                animationDelay: `${Math.random() * 0.5}s`,
                                animationDuration: `${1 + Math.random() * 1}s`,
                            }}
                        >
                            <div
                                className="w-3 h-3 rounded-sm"
                                style={{
                                    backgroundColor: ['#D4AF37', '#22C55E', '#8B5CF6', '#EF4444', '#3B82F6', '#F59E0B'][Math.floor(Math.random() * 6)],
                                    transform: `rotate(${Math.random() * 360}deg)`,
                                }}
                            />
                        </div>
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl animate-bounce-in">🎉</div>
                    </div>
                </div>
            )}

            <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">🎮 Join as Participant</CardTitle>
                <CardDescription>Enter the session code from the host to join instantly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!participantId ? (
                    <div className="grid gap-4 max-w-sm mx-auto">
                        <div className="space-y-2">
                            <Label htmlFor="participant-name">Your Name</Label>
                            <Input
                                id="participant-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="text-center text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="session-code">Session Code</Label>
                            <Input
                                id="session-code"
                                value={sessionCode}
                                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                                placeholder="ABCD"
                                className="text-center text-2xl font-bold tracking-widest"
                                maxLength={6}
                            />
                        </div>
                        <Button onClick={handleJoin} disabled={!name || !sessionCode} size="lg" className="mt-2">
                            🚀 Join Session
                        </Button>
                        {status && <p className="text-center text-sm text-red-400">{status}</p>}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* End-Game Summary */}
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

                                {/* Podium */}
                                <div className="flex justify-center items-end gap-4 py-4">
                                    {/* 2nd Place */}
                                    {sessionComplete.leaderboard[1] && (
                                        <div className="text-center">
                                            <div className="text-3xl mb-2">🥈</div>
                                            <div className="bg-gradient-to-b from-slate-400 to-slate-500 rounded-t-lg px-4 py-6 w-24">
                                                <p className="font-bold text-white truncate text-sm">{sessionComplete.leaderboard[1].name}</p>
                                                <p className="text-slate-200 text-xs">{sessionComplete.leaderboard[1].score} pts</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* 1st Place */}
                                    {sessionComplete.leaderboard[0] && (
                                        <div className="text-center">
                                            <div className="text-4xl mb-2 animate-bounce">🥇</div>
                                            <div className="bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-lg px-4 py-8 w-28">
                                                <p className="font-bold text-white truncate">{sessionComplete.leaderboard[0].name}</p>
                                                <p className="text-yellow-100 text-sm">{sessionComplete.leaderboard[0].score} pts</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* 3rd Place */}
                                    {sessionComplete.leaderboard[2] && (
                                        <div className="text-center">
                                            <div className="text-3xl mb-2">🥉</div>
                                            <div className="bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-lg px-4 py-4 w-24">
                                                <p className="font-bold text-white truncate text-sm">{sessionComplete.leaderboard[2].name}</p>
                                                <p className="text-amber-200 text-xs">{sessionComplete.leaderboard[2].score} pts</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Your Stats */}
                                {(() => {
                                    const myRank = sessionComplete.leaderboard.findIndex(p => p.name === name) + 1;
                                    const myScore = sessionComplete.leaderboard.find(p => p.name === name)?.score ?? 0;
                                    return myRank > 0 && (
                                        <div className="p-4 rounded-xl bg-purple-500/20 border border-purple-500/30">
                                            <p className="text-center text-sm text-purple-300 mb-2">Your Performance</p>
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <p className="text-2xl font-bold text-white">#{myRank}</p>
                                                    <p className="text-xs text-slate-400">Rank</p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-white">{myScore}</p>
                                                    <p className="text-xs text-slate-400">Points</p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-white">{sessionComplete.totalParticipants}</p>
                                                    <p className="text-xs text-slate-400">Players</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Full Leaderboard */}
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-slate-300 text-center">Final Standings</h3>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {sessionComplete.leaderboard.map((player, index) => (
                                            <div
                                                key={index}
                                                className={`flex items-center gap-3 p-3 rounded-lg ${player.name === name
                                                    ? 'bg-purple-500/20 border border-purple-500/50'
                                                    : 'bg-slate-800/50'
                                                    }`}
                                            >
                                                <span className="w-8 text-center font-bold text-slate-400">
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                                </span>
                                                {/* Avatar */}
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarColors[index % avatarColors.length]}`}>
                                                    {player.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className={`flex-1 font-medium ${player.name === name ? 'text-purple-300' : 'text-white'}`}>
                                                    {player.name} {player.name === name && '(You)'}
                                                </span>
                                                <span className="font-bold text-slate-300">{player.score} pts</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Play Again */}
                                <Button
                                    onClick={() => window.location.reload()}
                                    className="w-full"
                                    size="lg"
                                >
                                    🔄 Play Again
                                </Button>
                            </div>
                        ) : question ? (
                            <div className="space-y-4 animate-fade-in">
                                {/* Timer / Answer Locked / Time's Up Display */}
                                {hasAnswered && !timeExpired ? (
                                    /* Show "Answer Locked In" immediately when answered, timer still visible */
                                    <div className="relative">
                                        <div className="flex flex-col items-center justify-center gap-2 animate-bounce-in">
                                            <span className="text-4xl">✅</span>
                                            <div className="text-2xl font-bold text-green-400">Answer Locked In!</div>
                                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                <span>Time remaining:</span>
                                                <span className={`font-bold ${timerColor}`}>{timeLeft}s</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-3">
                                            <div
                                                className="h-full transition-all duration-1000 ease-linear rounded-full bg-green-500"
                                                style={{ width: `${timerProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : timeExpired ? (
                                    /* Show final state when time is up */
                                    <div className="relative py-4">
                                        <div className="flex flex-col items-center justify-center gap-2 animate-bounce-in">
                                            {hasAnswered ? (
                                                <>
                                                    <span className="text-5xl">✅</span>
                                                    <div className="text-2xl font-bold text-green-400">Answer Submitted!</div>
                                                    <p className="text-slate-400 text-sm">Waiting for results...</p>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-5xl">⏰</span>
                                                    <div className="text-3xl font-bold text-red-500">Time's Up!</div>
                                                    <p className="text-slate-400 text-sm">You didn't answer in time</p>
                                                </>
                                            )}
                                        </div>
                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-3">
                                            <div className={`h-full w-0 ${hasAnswered ? 'bg-green-500' : 'bg-red-500'} rounded-full`} />
                                        </div>
                                    </div>
                                ) : timeLeft !== null && (
                                    /* Normal timer countdown */
                                    <div className="relative">
                                        <div className="flex items-center justify-center gap-3 mb-2">
                                            <div className={`text-4xl font-bold ${timerColor} transition-colors`}>
                                                {timeLeft}
                                            </div>
                                            <span className="text-slate-400 text-sm">seconds</span>
                                        </div>
                                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-linear rounded-full ${timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${timerProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                                    <p className="text-xl font-semibold text-center text-white">{question.prompt}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {question.options.map((option, index) => (
                                        <button
                                            key={option.id}
                                            className={`
                                                ${revealedAnswerIndex === index
                                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 ring-4 ring-green-400 shadow-[0_0_25px_rgba(34,197,94,0.5)] scale-[1.02]'
                                                    : revealedAnswerIndex !== null && selectedOption === option.id && revealedAnswerIndex !== index
                                                        ? 'bg-gradient-to-r from-red-600 to-red-700 ring-4 ring-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                                                        : optionColors[index]
                                                }
                                                ${selectedOption === option.id && revealedAnswerIndex === null ? 'ring-4 ring-white shadow-[0_0_20px_rgba(255,255,255,0.5)] scale-[1.02]' : ''}
                                                ${(hasAnswered || timeExpired) && selectedOption !== option.id && revealedAnswerIndex !== index ? 'opacity-40 scale-[0.98]' : ''}
                                                ${timeExpired && !selectedOption && revealedAnswerIndex !== index ? 'opacity-50 grayscale' : ''}
                                                text-white font-medium py-4 px-4 rounded-xl 
                                                transition-all duration-300 ease-out
                                                flex items-center gap-3 text-left
                                                disabled:cursor-not-allowed
                                                hover:scale-[1.02] active:scale-[0.98]
                                                ${selectedOption === option.id && revealedAnswerIndex === null ? 'animate-pulse-subtle' : ''}
                                            `}
                                            disabled={hasAnswered || timeExpired}
                                            onClick={() => handleAnswer(option.id, index)}
                                        >
                                            <span className={`
                                                w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0
                                                ${revealedAnswerIndex === index
                                                    ? 'bg-white text-green-600'
                                                    : selectedOption === option.id
                                                        ? 'bg-white text-slate-800'
                                                        : 'bg-white/20'
                                                }
                                                transition-all duration-300
                                            `}>
                                                {String.fromCharCode(65 + index)}
                                            </span>
                                            <span className="flex-1">{option.text}</span>
                                            {revealedAnswerIndex === index && (
                                                <span className="text-2xl animate-bounce-in">✅</span>
                                            )}
                                            {revealedAnswerIndex !== null && selectedOption === option.id && revealedAnswerIndex !== index && (
                                                <span className="text-2xl animate-bounce-in">❌</span>
                                            )}
                                            {selectedOption === option.id && revealedAnswerIndex === null && (
                                                <span className="text-2xl animate-bounce-in">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-block p-6 rounded-full bg-purple-500/10 mb-4">
                                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <p className="text-lg text-slate-400">Waiting for the next question...</p>
                            </div>
                        )}

                        {status && !sessionComplete && (
                            <div className={`
                                text-center text-lg font-medium p-3 rounded-xl
                                ${status.includes('✓') && isCorrect ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-slate-300'}
                                transition-all duration-300
                            `}>
                                {isCorrect && <span className="text-2xl mr-2">🎉</span>}
                                {status}
                                {isCorrect && <span className="text-2xl ml-2">🎉</span>}
                            </div>
                        )}

                        {/* Enhanced Leaderboard - Only visible after timeout and before session complete */}
                        {timeExpired && !sessionComplete && (
                            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-700 animate-slide-in">
                                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    🏆 Leaderboard
                                </h4>
                                {processedLeaderboard.length > 0 ? (
                                    <div className="space-y-2">
                                        {displayList.map((entry, displayIdx) => {
                                            const isYou = entry.name === name;
                                            const actualRank = processedLeaderboard.findIndex(e => e.name === entry.name) + 1;
                                            const hasMedal = actualRank <= 3;

                                            return (
                                                <div
                                                    key={entry.name}
                                                    className={`
                                                    flex items-center justify-between px-4 py-3 rounded-xl
                                                    transition-all duration-500 ease-out animate-slide-in
                                                    ${isYou
                                                            ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                                            : actualRank === 1
                                                                ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30'
                                                                : actualRank === 2
                                                                    ? 'bg-gradient-to-r from-slate-400/20 to-slate-300/20 border border-slate-400/30'
                                                                    : actualRank === 3
                                                                        ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/20 border border-orange-600/30'
                                                                        : 'bg-slate-700/50 border border-slate-600/30'
                                                        }
                                                `}
                                                    style={{ animationDelay: `${displayIdx * 0.1}s`, animationFillMode: 'backwards' }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {/* Rank with Medal - only top 3 */}
                                                        <div className="w-8 text-center">
                                                            {actualRank === 1 && hasMedal ? (
                                                                <span className="text-2xl" style={{ textShadow: `0 0 10px ${medalColors.gold}` }}>🥇</span>
                                                            ) : actualRank === 2 && hasMedal ? (
                                                                <span className="text-2xl" style={{ textShadow: `0 0 10px ${medalColors.silver}` }}>🥈</span>
                                                            ) : actualRank === 3 && hasMedal ? (
                                                                <span className="text-2xl" style={{ textShadow: `0 0 10px ${medalColors.bronze}` }}>🥉</span>
                                                            ) : (
                                                                <span className={`text-lg font-bold ${isYou ? 'text-purple-300' : 'text-slate-400'}`}>
                                                                    {actualRank}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Avatar */}
                                                        <div className={`
                                                        w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
                                                        ${isYou ? 'bg-gradient-to-br from-purple-500 to-indigo-500 ring-2 ring-purple-300 ring-offset-2 ring-offset-slate-800' : getAvatarColor(entry.name)}
                                                    `}>
                                                            {getInitials(entry.name)}
                                                        </div>

                                                        {/* Name */}
                                                        <div className="flex flex-col">
                                                            <span className={`font-semibold ${isYou ? 'text-purple-200' : 'text-white'}`}>
                                                                {entry.name}
                                                            </span>
                                                            {isYou && (
                                                                <span className="text-xs text-purple-400 flex items-center gap-1">
                                                                    ⭐ You • Rank #{actualRank}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Score */}
                                                    <div className="flex items-center gap-2">
                                                        <span className={`
                                                        font-bold text-xl
                                                        ${isYou ? 'text-purple-300' : actualRank === 1 ? 'text-yellow-400' : actualRank === 2 ? 'text-slate-300' : actualRank === 3 ? 'text-orange-400' : 'text-white'}
                                                    `}>
                                                            {entry.score}
                                                        </span>
                                                        <span className="text-slate-500 text-sm">pts</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {userEntry && !userInTopFive && (
                                            <div className="text-center text-slate-500 text-xs py-1">• • •</div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">No scores yet</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            <style>{`
                @keyframes confetti {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
                }
                .animate-confetti { animation: confetti 2s ease-out forwards; }
                
                @keyframes bounce-in {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-bounce-in { animation: bounce-in 0.4s ease-out forwards; }
                
                @keyframes slide-in {
                    0% { transform: translateX(-20px); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in { animation: slide-in 0.4s ease-out forwards; }
                
                @keyframes pulse-subtle {
                    0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.3); }
                    50% { box-shadow: 0 0 30px rgba(255,255,255,0.5); }
                }
                .animate-pulse-subtle { animation: pulse-subtle 1.5s ease-in-out infinite; }
            `}</style>
        </Card>
    );
}
