# 🎯 QuizBlitz - Real-Time AI Quiz Builder

A Kahoot-style quiz platform powered by AI (via OpenRouter), Socket.IO, and PostgreSQL/Prisma. Educators can generate quizzes using AI or create them manually, host live sessions, and participants join via a code to answer questions in real time.

![Quiz Builder Demo](/login.png)

## ✨ Features

### 🤖 Quiz Creation
- **AI-Powered Quiz Generation** - Generate quizzes on any topic using OpenRouter's AI models (GPT-4, Claude, Gemini, etc.)
- **Manual Quiz Editor** - Create custom quizzes with a user-friendly form interface
- **Quiz Management** - View quiz details (question count, difficulty) and delete quizzes

### 🎮 Live Quiz Experience
- **Real-Time Multiplayer** - Host live quiz sessions with instant question broadcasting
- **Color-Coded Answers** - Kahoot-style answer buttons (Red, Blue, Yellow, Green)
- **Automatic Answer Reveal** - When time expires, the correct answer is automatically highlighted
- **Live Leaderboard** - Real-time score tracking with colorful player avatars

### 🏆 End-Game Summary
- **Winner Celebration** - Trophy animation for the quiz champion
- **Podium Display** - Visual podium showing 1st, 2nd, and 3rd place
- **Personal Stats** - Each participant sees their rank and score
- **Full Standings** - Complete leaderboard with player avatars and medals

### 🎨 Modern UI
- **Glass Morphism Design** - Beautiful frosted glass effects
- **Dark Theme** - Easy on the eyes with gradient accents
- **Smooth Animations** - Polished transitions and hover effects
- **Responsive Layout** - Works on desktop and mobile

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, TypeScript, Express, Socket.IO, Prisma, PostgreSQL |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, Zustand |
| **AI** | OpenRouter API (supports GPT-4, Claude, Gemini, Llama, etc.) |

## 📁 Project Structure

```
backend/
  src/
    core/           # Domain models, use cases, and ports
    adapters/       # HTTP, WebSocket, OpenRouter, and Postgres adapters
    infrastructure/ # Express app + Prisma client
    shared/         # Environment utilities
  prisma/           # Prisma schema & migrations

frontend/
  src/
    components/     # UI components + feature modules
      ├── QuizForm.tsx        # AI quiz generation
      ├── ManualQuizEditor.tsx # Manual quiz creation
      ├── SessionHost.tsx     # Host dashboard & controls
      └── ParticipantView.tsx # Player experience
    services/       # API + socket helpers
    store/          # Zustand state management
```

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- OpenRouter API key ([Get one here](https://openrouter.ai/keys))

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and OPENROUTER_API_KEY
npm install
npx prisma migrate dev --name init
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## 🔧 Configuration

### Backend (.env)
```env
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/quiz_app?schema=public
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/quiz/generate` | Generate a new quiz using AI |
| POST | `/quiz/create` | Create a quiz manually |
| GET | `/quiz` | List all quizzes |
| DELETE | `/quiz/:id` | Delete a quiz |
| POST | `/session/create` | Create a new live session |
| POST | `/session/:id/start` | Start the quiz session |
| POST | `/session/:id/end` | End the session |

## 🔌 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `host:join` | Client → Server | Host joins session room |
| `participant:join` | Client → Server | Participant joins with name & code |
| `participant:answer` | Client → Server | Submit an answer |
| `question:next` | Server → Clients | Broadcast next question |
| `question:reveal` | Server → Clients | Reveal correct answer |
| `leaderboard:update` | Server → Clients | Update leaderboard scores |
| `session:complete` | Server → Clients | Final summary with podium & stats |
| `session:end` | Server → Clients | Session has ended |

## 🎮 How to Use

### Creating Quizzes

#### Option 1: AI Generation 🤖
1. Go to the **🤖 AI Quiz** tab
2. Enter a topic (e.g., "JavaScript Fundamentals")
3. Select difficulty and number of questions
4. Click **Generate Quiz**

#### Option 2: Manual Editor ✏️
1. Go to the **✏️ Manual Editor** tab
2. Fill in quiz title, topic, and difficulty
3. Add questions with 4 options each
4. Click the letter button (A/B/C/D) to mark the correct answer
5. Click **Create Quiz**

### Hosting a Quiz Session 📡
1. Go to the **📡 Host Session** tab
2. Select a quiz from the dropdown (shows question count & difficulty)
3. Click **Create Session** to get a session code
4. Share the code with participants
5. Click **Start Quiz** when everyone has joined
6. Use **Next Question** and **Reveal Answer** to control the flow
7. Click **End Session** to show the final podium & standings

### Joining as a Participant 🎯
1. Open the **Participant** tab
2. Enter your name and the session code
3. Click **Join Session**
4. Answer questions before time runs out
5. If you miss the timer, the correct answer is revealed automatically
6. Watch your position on the live leaderboard
7. See the final podium and your rank at the end!

## 🎨 Customization

### Changing the AI Model

Edit `backend/src/adapters/outbound/openrouter/openrouter.adapter.ts`:

```typescript
const DEFAULT_MODEL = "google/gemini-2.0-flash-001"; // Change this
```

Popular models:
- `openai/gpt-4o` - Best quality
- `anthropic/claude-3.5-sonnet` - Strong reasoning
- `google/gemini-2.0-flash-001` - Fast & affordable
- `meta-llama/llama-3.1-70b-instruct` - Open source

## ✅ Recent Updates

- [x] Timer with automatic answer reveal
- [x] Manual quiz creation editor
- [x] Quiz deletion functionality
- [x] End-game summary with podium and full standings
- [x] Player avatars in leaderboard
- [x] Leaderboard deduplication (prevents duplicate entries)



## 📄 License

MIT License - feel free to use this for your projects!

---

Happy quizzing! 🎉
