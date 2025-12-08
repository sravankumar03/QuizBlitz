import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { QuizGenerator } from "./components/QuizGenerator";
import { SessionHost } from "./components/SessionHost";
import { ParticipantView } from "./components/ParticipantView";
import { ManualQuizEditor } from "./components/ManualQuizEditor";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { getSocket } from "./services/socket";

function App() {
    const socket = useMemo(() => getSocket(), []);
    const [gamePin, setGamePin] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [showDashboard, setShowDashboard] = useState(false);
    const [showParticipant, setShowParticipant] = useState(false);
    const [joinError, setJoinError] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    const handleEnterGame = () => {
        setIsJoining(true);
        setJoinError("");
        socket.emit("participant:join", { sessionCode: gamePin, name: playerName }, (response: any) => {
            setIsJoining(false);
            if (response?.error) {
                setJoinError(response.error);
                return;
            }
            // Successfully joined - show participant view
            setShowParticipant(true);
        });
    };

    // Show Participant View after joining
    if (showParticipant) {
        return <ParticipantView initialName={playerName} initialSessionCode={gamePin} />;
    }

    if (showDashboard) {
        return (
            <div className="min-h-screen">
                {/* Top Navigation Bar */}
                <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
                    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                        {/* Left Side - Back & Logo */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowDashboard(false)}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">⚡</span>
                                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">QuizBlitz</span>
                            </div>
                        </div>

                        {/* Right Side - Dashboard Label */}
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-sm font-medium">Host Dashboard</span>
                        </div>
                    </div>
                </nav>

                {/* Dashboard Content */}
                <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
                    <Tabs defaultValue="educator" className="space-y-6">
                        {/* Centered Tab Navigation */}
                        <div className="flex justify-center">
                            <TabsList className="glass rounded-xl p-1.5 inline-flex gap-1">
                                <TabsTrigger
                                    value="educator"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-3 transition-all font-medium"
                                >
                                    🤖 AI Quiz
                                </TabsTrigger>
                                <TabsTrigger
                                    value="manual"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-3 transition-all font-medium"
                                >
                                    ✏️ Manual Editor
                                </TabsTrigger>
                                <TabsTrigger
                                    value="host"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-6 py-3 transition-all font-medium"
                                >
                                    📡 Host Session
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="educator" className="animate-fade-in">
                            <QuizGenerator />
                        </TabsContent>
                        <TabsContent value="manual" className="animate-fade-in">
                            <ManualQuizEditor />
                        </TabsContent>
                        <TabsContent value="host" className="animate-fade-in">
                            <SessionHost />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Hero Section */}
            <header className="relative z-10 pt-8 pb-4 px-4">
                <div className="mx-auto max-w-6xl">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-3 mb-12">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
                            ⚡
                        </div>
                        <span className="text-3xl font-bold gradient-text">QuizBlitz</span>
                    </div>

                    {/* Hero Content */}
                    <div className="text-center space-y-6 mb-12">
                        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
                            <span className="gradient-text">Learn Together.</span>
                            <br />
                            <span className="text-white">Play Together.</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Create AI-powered quizzes in seconds, host live game sessions,
                            and compete with friends in real-time.
                        </p>
                    </div>
                </div>
            </header>

            {/* Join Game Card */}
            <section className="relative z-10 px-4 pb-16">
                <div className="mx-auto max-w-md">
                    <div className="glass rounded-3xl p-8 shadow-[0_0_60px_rgba(139,92,246,0.3)] border border-purple-500/30 relative">
                        {/* Card glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-purple-600/20 rounded-3xl blur-xl -z-10" />
                        <h2 className="text-2xl font-bold text-center text-white mb-6">Join a Game</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="Game PIN"
                                    value={gamePin}
                                    onChange={(e) => setGamePin(e.target.value.toUpperCase())}
                                    className="h-14 text-center text-2xl font-bold tracking-[0.3em] bg-slate-900/80 border-2 border-purple-500/40 placeholder:text-slate-400 placeholder:text-lg placeholder:tracking-normal focus:border-purple-400 focus:ring-purple-400/30"
                                    maxLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    placeholder="Your Nickname"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    className="h-12 text-center text-lg bg-slate-900/80 border-2 border-purple-500/40 placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/30"
                                />
                            </div>
                            {joinError && (
                                <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm text-center">
                                    {joinError}
                                </div>
                            )}
                            <Button
                                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 shadow-[0_4px_20px_rgba(34,197,94,0.4)] hover:shadow-[0_4px_30px_rgba(34,197,94,0.5)] border-0"
                                disabled={!gamePin || !playerName || isJoining}
                                onClick={handleEnterGame}
                            >
                                {isJoining ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Joining...
                                    </span>
                                ) : (
                                    "🚀 Enter Game"
                                )}
                            </Button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-700/50">
                            <p className="text-sm text-slate-400 text-center mb-4">Want to create and host your own quiz?</p>
                            <Button
                                variant="ghost"
                                className="w-full h-12 text-purple-400 hover:text-purple-300 bg-transparent hover:bg-purple-500/10 border border-purple-500/50 hover:border-purple-400 rounded-lg transition-all font-medium"
                                onClick={() => setShowDashboard(true)}
                            >
                                ⚡ Create Quiz as Host
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative z-10 px-4 py-20 mt-auto">
                <div className="mx-auto max-w-5xl">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
                        Why Choose <span className="gradient-text">QuizBlitz</span>?
                    </h2>
                    <p className="text-slate-500 text-center mb-14 max-w-xl mx-auto">
                        Everything you need to create engaging learning experiences
                    </p>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="glass rounded-2xl p-6 text-center hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 group">
                            <div className="relative w-16 h-16 mx-auto mb-5">
                                <div className="absolute inset-0 bg-purple-500/30 rounded-2xl blur-lg group-hover:blur-xl transition-all" />
                                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center text-4xl">
                                    ✨
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">AI Generation</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-[240px] mx-auto">
                                Generate quizzes on any topic instantly using advanced AI. Just enter a topic and let the magic happen.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="glass rounded-2xl p-6 text-center hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 group">
                            <div className="relative w-16 h-16 mx-auto mb-5">
                                <div className="absolute inset-0 bg-blue-500/30 rounded-2xl blur-lg group-hover:blur-xl transition-all" />
                                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-4xl">
                                    🎮
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Live Multiplayer</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-[240px] mx-auto">
                                Host real-time quiz sessions with unlimited participants. Everyone plays together, answering at the same time.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="glass rounded-2xl p-6 text-center hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 group">
                            <div className="relative w-16 h-16 mx-auto mb-5">
                                <div className="absolute inset-0 bg-yellow-500/30 rounded-2xl blur-lg group-hover:blur-xl transition-all" />
                                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center text-4xl">
                                    🏆
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Live Leaderboards</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-[240px] mx-auto">
                                Track scores in real-time with animated leaderboards. See who’s winning and compete for the top spot.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-8 border-t border-slate-800/50">
                <p className="text-center text-slate-600 text-xs tracking-wide">
                    Made with ⚡ by QuizBlitz • Powered by AI
                </p>
            </footer>

            {/* Participant Modal Integration */}
            {gamePin && playerName && (
                <div className="hidden">
                    <ParticipantView />
                </div>
            )}
        </div>
    );
}

export default App;
