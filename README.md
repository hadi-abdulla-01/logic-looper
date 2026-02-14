# 🎮 Logic Looper - Daily Puzzle Game

A modern, engaging daily puzzle game built with Next.js 15, featuring offline-first architecture, Google authentication, and comprehensive scoring system.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-7.4-2D3748)
![NextAuth](https://img.shields.io/badge/NextAuth-Latest-purple)

---

## ✨ Features

### 🎯 Core Gameplay
- **3 Puzzle Types**: NumberMatrix (Sudoku-like), PatternMatching, SequenceSolver
- **Daily Challenges**: New puzzle every day at midnight
- **AI-Powered**: Puzzles generated using Google Gemini AI
- **Smart Hints**: Contextual hints that don't give away the solution
- **Timer & Scoring**: Comprehensive scoring system with ranks (S/A/B/C/D)

### 🔐 Authentication
- **Google OAuth**: Secure sign-in with Google
- **Guest Mode**: Play without signing in (offline only)
- **Session Management**: Persistent sessions with NextAuth.js

### 💾 Data Management
- **Offline-First**: IndexedDB for local storage
- **Cloud Sync**: Automatic sync when online (if authenticated)
- **Neon PostgreSQL**: Scalable cloud database
- **Prisma ORM**: Type-safe database access

### 📊 Progress Tracking
- **Streak System**: Track daily completion streaks
- **Activity Heatmap**: GitHub-style 365-day visualization
- **Leaderboard**: Daily top 100 scores
- **Achievements**: Unlock badges for milestones

### 🎨 UI/UX
- **Modern Design**: Clean, responsive interface
- **Dark Mode**: Built-in dark mode support
- **Animations**: Smooth transitions and confetti celebrations
- **Mobile-First**: Optimized for all screen sizes

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Cloud account (for OAuth & Gemini API)
- Neon.tech account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd logic-looper-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required values in `.env.local`:
   - `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Get from [Google Cloud Console](https://console.cloud.google.com/)
   - `DATABASE_URL` - Get from [Neon.tech](https://neon.tech)
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`

4. **Initialize database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:9002
   ```

📖 **For detailed setup instructions, see [SETUP.md](./SETUP.md)**

---

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui + Radix UI
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL (Neon.tech)
- **ORM**: Prisma
- **AI**: Google Gemini (via Genkit)
- **Storage**: IndexedDB (Dexie.js)
- **Animations**: Framer Motion + Canvas Confetti

### Project Structure
```
logic-looper-main/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   ├── scores/        # Score sync API
│   │   │   └── leaderboard/   # Leaderboard API
│   │   ├── achievements/      # Achievements page
│   │   ├── leaderboard/       # Leaderboard page
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/                # Shadcn/ui components
│   │   ├── puzzle-*.tsx       # Puzzle type components
│   │   ├── puzzle-controls.tsx
│   │   ├── activity-heatmap.tsx
│   │   └── header.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-puzzle-timer.ts
│   │   └── use-local-storage.ts
│   ├── lib/                   # Utility libraries
│   │   ├── indexeddb.ts       # IndexedDB wrapper
│   │   ├── scoring.ts         # Scoring system
│   │   ├── date-utils.ts      # Date utilities
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # NextAuth config
│   │   ├── actions.ts         # Server actions
│   │   └── puzzle-validators.ts
│   ├── ai/                    # AI flows
│   │   ├── genkit.ts          # Genkit setup
│   │   └── flows/
│   │       ├── dynamic-daily-puzzle-generation.ts
│   │       └── contextual-puzzle-hints.ts
│   └── types/                 # TypeScript types
├── prisma/
│   └── schema.prisma          # Database schema
├── .agent/                    # Development docs
│   ├── implementation-plan.md
│   └── progress-report.md
├── docs/
│   └── blueprint.md           # Project blueprint
└── SETUP.md                   # Setup guide
```

---

## 🎮 How to Play

1. **Sign In** (optional): Click "Sign In with Google" in the header
2. **Solve Puzzle**: Complete today's daily puzzle
3. **Get Hints**: Use the hint button if stuck (penalty applies)
4. **Validate**: Check your solution
5. **Track Progress**: View your streak and activity heatmap
6. **Compete**: Check the leaderboard for top scores

---

## 📊 Scoring System

### Base Scores
- Easy: 100 points
- Medium: 250 points
- Hard: 500 points
- Expert: 1000 points

### Multipliers
- **Time Bonus**: 0.5x to 2.0x based on completion speed
- **Hint Penalty**: Diminishing returns (-30%, -20%, -15%, -10%...)
- **Perfect Bonus**: +200 points for no hints used

### Ranks
- **S**: 90%+ of max possible score
- **A**: 75-89%
- **B**: 60-74%
- **C**: 45-59%
- **D**: Below 45%

---

## 🗄️ Database Schema

### Key Models
- **User**: Authentication + game stats
- **Account**: OAuth accounts
- **Session**: User sessions
- **DailyScore**: Puzzle completion records
- **Achievement**: Achievement definitions
- **UserAchievement**: User progress on achievements
- **Leaderboard**: Daily top scores

See `prisma/schema.prisma` for full schema.

---

## 🔌 API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Scores
- `POST /api/scores` - Submit daily score
- `GET /api/scores` - Get user's score history

### Leaderboard
- `GET /api/leaderboard?date=YYYY-MM-DD` - Get daily leaderboard

---

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio
npx prisma generate  # Generate Prisma Client
npx prisma db push   # Push schema to database
```

### Environment Variables
See `.env.example` for all required variables.

---

## 📈 Roadmap

### ✅ Completed (v1.0)
- [x] 3 puzzle types
- [x] Timer & scoring system
- [x] IndexedDB offline storage
- [x] Google authentication
- [x] Neon database integration
- [x] Activity heatmap
- [x] Leaderboard
- [x] AI-powered hints

### 🚧 In Progress
- [ ] Achievement logic
- [ ] Service Worker for offline
- [ ] Background sync
- [ ] Mobile app (React Native)

### 🔮 Future
- [ ] 2 more puzzle types (DeductionGrid, BinaryLogic)
- [ ] Friend challenges
- [ ] Puzzle sharing via URL
- [ ] Progressive difficulty
- [ ] Truecaller authentication
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Shadcn/ui](https://ui.shadcn.com/) - UI components
- [Prisma](https://www.prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Neon](https://neon.tech/) - Serverless Postgres
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI model
- [Genkit](https://firebase.google.com/docs/genkit) - AI framework

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check [SETUP.md](./SETUP.md) for setup help
- Review [docs/blueprint.md](./docs/blueprint.md) for architecture details

---

**Made with ❤️ by the Logic Looper Team**

🎮 Happy Puzzling! 🧩
