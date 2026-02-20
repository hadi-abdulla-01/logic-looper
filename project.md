# Logic Looper — Project Documentation

> **Prepared by:** Mohammed Hadi Abdulla  
> **Date:** February 20, 2026  
> **Version:** 1.0.0  
> **Repository:** [github.com/hadi-abdulla-01/logic-looper](https://github.com/hadi-abdulla-01/logic-looper)  
> **Powered by:** Bluestock.in Internship Programme

---

## 1. Puzzle Game Name

# 🔁 Logic Looper
**Tagline:** *Daily Challenges & Unlimited Brain Training.*

Logic Looper is a daily puzzle game web application that presents users with a personalised logic-based challenge every single day, plus an unlimited practice mode for extra play. Players solve puzzles, earn scores, build daily streaks, and compete on a global leaderboard — all accessible from any device, even without an internet connection.

---

## 2. Working Principle

Logic Looper follows a **daily-unlock, streak-based puzzle model** similar to Wordle or the NYT Games suite — but focused on logic and pattern reasoning.

### How It Works (Step by Step)

```
User visits the app
        ↓
GuestId (UUID) generated & stored in localStorage on first visit
        ↓
Today's puzzle generated: seed = SHA(date + userId)  ← logged-in
                       OR  seed = SHA(date + guestId) ← guest
        ↓
User clicks "Start" → Timer begins
        ↓
User fills in answers → Progress auto-saved to IndexedDB on every keystroke
        ↓
User submits → Solution is validated client-side
        ↓
Score calculated: Base Score × Time Multiplier − Hint Penalty + Perfect Bonus
        ↓
Rank assigned: S / A / B / C / D based on score ratio
        ↓
Result saved to IndexedDB → Heatmap updates → Streak increments
        ↓
If online: Score synced to PostgreSQL backend via /api/sync/daily-scores
        ↓
Achievements checked → Leaderboard updated
```

> ⚠️ **Anti-Cheat Note:** Because the puzzle seed includes the player's unique ID, a guest and a logged-in account on the same device get **different puzzles**. A player cannot memorise answers from a guest session then replay them on their real account for a faster time.

### Key Design Philosophy

- **Offline-First**: All core functions (puzzle play, saving, achievements) work without internet
- **Personalised Puzzle Seeds**: `seed = FNV-hash(date + userId)` — every player gets a unique puzzle for the day, preventing replay cheating
- **Guest-Friendly**: No login required to play; progress persists via browser IndexedDB
- **Unlimited Mode**: Random puzzles can be generated on demand for extra practice beyond the daily challenge
- **Sync on Reconnect**: When internet is restored, scores sync automatically via the Service Worker

---

## 3. Features Implemented

### 🧩 Puzzle Engine
| Feature | Detail |
|---|---|
| **3 Puzzle Types** | Number Matrix (Sudoku-style), Pattern Matching (emoji/shape sequences), Sequence Solver (arithmetic, geometric, Fibonacci) |
| **Daily Puzzles** | Date + player-ID seeded personalised puzzle — same player always gets the same puzzle on the same day (reload-safe) |
| **Unlimited Play Mode** | Generate fresh random puzzles on demand without waiting for tomorrow |
| **Client-Side Validation** | All puzzle solutions validated locally — instant feedback, no server round-trip |
| **Hint System** | Up to 3 contextual hints per puzzle; each hint reduces the final score |
| **Auto-Save Progress** | Every keystroke saves to IndexedDB — page refresh restores exact state |
| **Timer** | Starts on first interaction, stops on solve — used in score calculation |

### 📊 Scoring & Ranking
| Component | Detail |
|---|---|
| **Score Formula** | `Base Score × Time Multiplier − (Hints Used × Penalty) + Perfect Bonus` |
| **Rank System** | S (≥90%), A (≥75%), B (≥55%), C (≥35%), D (below 35%) |
| **Difficulty Levels** | Easy, Medium, Hard based on grid size and complexity |
| **Perfect Run Bonus** | Extra points for solving with no hints |

### 🔥 Streak & Progress Tracking
| Feature | Detail |
|---|---|
| **Daily Streak Counter** | Tracks consecutive days played; resets if a day is missed |
| **Leap Year Safe** | Correctly handles 365/366-day years |
| **Streak Indicator** | Animated 🔥 fire emoji in the header and puzzle timer bar |
| **4 Live Stats Cards** | Current Streak, Puzzles Solved, Total Score, Average Time — update instantly on solve |

### 🗓️ Activity Heatmap
| Feature | Detail |
|---|---|
| **365-Day Grid** | GitHub-style contribution graph for the entire year |
| **Rank-Based Colour Intensity** | S=darkest indigo, A=strong, B=medium, C/D=light, 0=grey |
| **Month & Day Labels** | Month names above, M/W/F day labels on the left |
| **Hover Tooltips** | Shows date, rank, score, time, and puzzle type on each cell |
| **Today Highlight** | Ring around today's cell for quick orientation |
| **Instant Refresh** | Heatmap updates the moment a puzzle is completed |

### 🏆 Achievements (14 Total)
| Category | Achievements |
|---|---|
| **Completion** | Puzzle Pioneer, Getting Warmed Up, Dedicated Solver, Logic Lord |
| **Streak** | On a Roll (3 days), Weekly Warrior (7), Monthly Master (30), Century Club (100) |
| **Speed** | Speed Demon (avg solve < 3 min) |
| **Perfect** | Flawless (no hints ever), S-Rank Legend (first S), Elite Mind (5× S-rank) |
| **Score** | Point Hoarder (1,000 pts), Score Master (10,000 pts) |

All achievements work for **guest users** using IndexedDB — no login required.

### 🌐 Offline & PWA Support
| Feature | Detail |
|---|---|
| **Service Worker** | Cache-first for static assets; network-first for API with offline fallback |
| **PWA Manifest** | App is installable on mobile & desktop as a standalone app |
| **IndexedDB Storage** | Puzzles, daily activity, achievements, and user progress stored locally |
| **Sync on Reconnect** | Background sync queues scores when offline, uploads when back online |
| **Online/Offline Indicator** | Live colour-coded pill in the header (green = online, amber = offline) |

### 🔒 Authentication & Backend
| Feature | Detail |
|---|---|
| **Google OAuth** | Sign in with Google via NextAuth.js |
| **Session Management** | JWT-based sessions with streak/score data embedded |
| **POST /api/sync/daily-scores** | Full upsert with best-score-wins logic |
| **Security Validation** | ❌ Rejects future dates, score > 3000, time < 5s, invalid rank |
| **Leaderboard Update** | Auto-updates Leaderboard table per sync |
| **Server-Side Streak Recalc** | Recalculates streak from full history on server |
| **savePuzzleCompletion()** | Existing server action as first sync path |
| **GET /api/sync/daily-scores** | Returns last 365 days of scores |
| **Anti-Cheat: Player-Unique Seeds** | Puzzle seed = `FNV_hash(date + userId)` — guest and logged-in user always get different puzzles, so memorising guest answers gives zero advantage on a real account |
| **Guest ID Persistence** | UUID generated on first visit, stored in `localStorage` as `ll_guest_id` — persists across sessions until the browser is cleared |

### 🎨 UI & Animations
| Feature | Detail |
|---|---|
| **Font** | Poppins (Google Fonts) — 300–800 weight range |
| **Custom Animations** | Streak fire pulse, score reveal slide-up, sync pulse, cell glow, floating brain |
| **Confetti on Completion** | Gold confetti for S-rank, green for A, blue for B–D |
| **Gradient Success Toast** | Full breakdown of score, rank, time, and streak in animated toast |
| **Cell Highlighting** | Active row/column highlighted in NumberMatrix puzzle on cell focus |
| **Puzzle Type Badge** | Pill badge showing puzzle type and date on the board header |

---

## 4. Technologies Used

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 15** (App Router) | React framework with server & client components |
| **React 18** | UI component library |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **Shadcn/UI** | Pre-built accessible UI components (Card, Toast, Dialog, Sidebar, etc.) |
| **Lucide React** | Icon library |
| **date-fns** | Date manipulation and formatting |
| **canvas-confetti** | Confetti animation on puzzle completion |

### Backend & Data
| Technology | Purpose |
|---|---|
| **Next.js API Routes** | Server-side REST endpoints |
| **Prisma ORM** | Type-safe database access |
| **PostgreSQL (Neon)** | Serverless cloud database |
| **NextAuth.js** | Authentication with Google OAuth provider |
| **IndexedDB** | Browser-native offline storage for puzzles, scores, and achievements |

### Infrastructure & PWA
| Technology | Purpose |
|---|---|
| **Service Worker** | Offline caching and background sync |
| **Web App Manifest** | PWA installability on mobile/desktop |
| **Google Fonts (Poppins)** | Typography |
| **Vercel (planned)** | Deployment platform |

### AI / Generation
| Technology | Purpose |
|---|---|
| **Google Gemini API** | Contextual hint generation for puzzles |
| **Deterministic Seeding** | Date-based puzzle generation (no AI needed for daily puzzles) |

---

## 5. What Has Been Completed

| Module | Status | Notes |
|---|---|---|
| Number Matrix Puzzle | ✅ Complete | Full auto-save, restore, validation |
| Pattern Matching Puzzle | ✅ Complete | Emoji/shape sequence selection |
| Sequence Solver Puzzle | ✅ Complete | Arithmetic, geometric, Fibonacci |
| Daily Puzzle Generation | ✅ Complete | Date-seeded, deterministic |
| Unlimited Play Mode | ✅ Complete | Random puzzles on demand |
| Timer System | ✅ Complete | Starts on interaction, stops on solve |
| Scoring + Rank System | ✅ Complete | S/A/B/C/D with full breakdown |
| Hint System | ✅ Complete | Gemini-powered, score-penalising |
| Auto-Save (IndexedDB) | ✅ Complete | Every keystroke saved |
| Progress Restore | ✅ Complete | State restored on page reload |
| Streak Tracking | ✅ Complete | Timezone-safe, leap-year-safe |
| Live Stats Cards | ✅ Complete | 4 cards, refresh on solve |
| Activity Heatmap | ✅ Complete | 365-day, rank-coloured, tooltips |
| 14 Achievements | ✅ Complete | Works for guests via IndexedDB |
| Achievements Page | ✅ Complete | Progress bars, category grouping |
| Confetti Animation | ✅ Complete | Rank-coloured on completion |
| Service Worker | ✅ Complete | Cache-first + network-first strategies |
| PWA Manifest | ✅ Complete | Installable app |
| Online/Offline Indicator | ✅ Complete | Live pill in header |
| Sync API | ✅ Complete | POST with full security validation |
| Leaderboard | ✅ Complete | Auto-updated on sync |
| Google OAuth | ✅ Complete | NextAuth.js integration |
| Custom Logo Integration | ✅ Complete | Bluestock.in logo in sidebar |
| Responsive Design | ✅ Complete | Works on mobile and desktop |
| Poppins Font + Animations | ✅ Complete | Custom keyframes for all interactions |
| DeductionGrid Puzzle | 🔜 Planned | Defined in schema, not yet implemented |
| BinaryLogic Puzzle | 🔜 Planned | Defined in schema, not yet implemented |
| Telegram Login | 🔜 Planned | Future auth provider |
| Guest → Account Data Sync | 🔜 Planned | Merge local data on first login |

---

## 6. Future Scope

### Short-Term (1–3 Months)
- **DeductionGrid Puzzle** — Einstein's riddle-style logic grid where players deduce facts from clues
- **BinaryLogic Puzzle** — Solve boolean/truth-table problems
- **Guest → Logged-In Data Migration** — When a guest signs in, merge their IndexedDB history with their server account
- **Telegram Login** — Add Telegram as an OAuth provider alongside Google
- **Email / Magic Link Login** — For users without Google/Telegram accounts
- **Daily Notifications** — Push notification ("Your daily puzzle is ready!") via Web Push API

### Medium-Term (3–6 Months)
- **Weekly Challenges** — Special harder puzzles unlocked each Monday
- **Puzzle Difficulty Selection** — Let users opt into Beginner / Normal / Expert variants
- **Friends & Social** — Follow friends, compare streaks, send challenges
- **Puzzle History Review** — Browse past completed puzzles and replay them
- **Leaderboard Seasons** — Monthly/quarterly seasons with resets and rewards
- **Time Attack Mode** — Solve as many puzzles as possible in 5 minutes

### Long-Term (6+ Months)
- **Native Mobile App** — React Native or Flutter wrapper for iOS/Android distribution
- **AI-Generated Puzzles** — Use Gemini to generate completely novel puzzle types
- **Puzzle Creator Tool** — Let users create and submit custom puzzles
- **Classroom Mode** — Teachers create puzzle sets, students compete within a class
- **Multi-Language Support** — Internationalise the UI for Hindi, Arabic, Spanish, etc.
- **Monetisation** — Premium tier with puzzle packs, no-ads, exclusive themes

---

## 7. Improvements Needed

### Performance
- [ ] **Puzzle generation caching** — Pre-generate the next 7 days of puzzles server-side to avoid client-side computation delay
- [ ] **Image optimisation** — Use `next/image` with proper sizing and WebP format for all assets
- [ ] **Bundle size audit** — Tree-shake unused Shadcn components to reduce JS bundle
- [ ] **Static page generation** — Pre-render leaderboard and achievements with ISR (Incremental Static Regeneration)

### User Experience
- [ ] **Puzzle onboarding tutorial** — First-time users need a quick walkthrough of puzzle rules
- [ ] **Undo button** — Allow players to undo the last cell entry in NumberMatrix
- [ ] **Keyboard shortcut support** — Arrow key navigation in matrix puzzle
- [ ] **Haptic feedback on mobile** — Vibration on correct/incorrect submission
- [ ] **Sound effects** — Optional audio cues for correct fills, completion, and new streaks

### Reliability
- [ ] **Conflict resolution for sync** — Handle cases where guest scores + logged-in scores both exist for the same date
- [ ] **Error boundary** — Graceful catch for IndexedDB failures (private browsing mode blocks it)
- [ ] **Retry queue** — If sync API fails, retry with exponential backoff
- [ ] **Offline page** — A styled "You're offline" page instead of a blank screen when SW fallback is hit

### Code Quality
- [ ] **Unit tests** — Write tests for `puzzle-validators.ts`, `scoring.ts`, and `date-utils.ts`
- [ ] **E2E tests** — Playwright tests for the core solve → save → sync flow
- [ ] **ESLint cleanup** — Resolve pre-existing TypeScript/ESLint warnings across the codebase
- [ ] **Environment validation** — Use `zod` to validate `.env` on startup and fail fast on missing variables

---

## 8. Suggestions

### For Deployment
1. **Deploy on Vercel** — Connect the GitHub repo directly; Vercel auto-detects Next.js and handles environment variables
2. **Use Neon's connection pooling** (`?pgbouncer=true`) for the `DATABASE_URL` in production to avoid connection limits under load
3. **Set `NEXTAUTH_URL`** to the production domain before deploying (critical for OAuth callbacks)
4. **Add a `robots.txt`** and sitemap for SEO — currently missing

### For Growth
1. **Share streak on social media** — Add a "Share my streak" button that generates a shareable image card (like Wordle's grid share)
2. **Daily email digest** — "Yesterday's puzzle results and today's challenge" newsletter
3. **Public API** — Expose puzzle data as a public REST API so developers can build their own clients
4. **Analytics** — Integrate Plausible or PostHog (privacy-safe) to track which puzzle types are most popular

### For Code Maintainability
1. **Centralise IndexedDB logic** — Wrap all IndexedDB reads/writes in a single `useIndexedDB` hook to avoid scattered direct calls
2. **Separate puzzle types into plugins** — Each puzzle type (NumMatrix, Pattern, Sequence) could be a self-contained module with schema, generator, validator, and component
3. **Use React Query (TanStack)** — Replace manual `useState/useEffect` data fetching with `useQuery` for caching, refetch, and loading states

---

## 9. Challenges Faced

### 1. Turbopack HMR Cache Corruption
**Problem:** After replacing `logo.tsx` (which had a `lucide-react/Infinity` import), Turbopack kept a stale compiled module in its `.next/cache`. The error `module factory is not available` appeared on every page load even after correcting the source file and restarting the server.  
**Solution:** Deleting the entire `.next` folder forced a complete recompilation from scratch, clearing all stale module references.

### 2. Offline-First Architecture with IndexedDB
**Problem:** IndexedDB is asynchronous but not Promise-based natively, and it's unavailable in private/incognito browsing. Wrapping it safely for SSR (where `window` doesn't exist) required careful `typeof window !== 'undefined'` guards.  
**Solution:** Created a centralised `src/lib/indexeddb.ts` wrapper with Promise-based helpers and SSR-safe lazy initialisation.

### 3. Deterministic Puzzle Generation
**Problem:** Using `Math.random()` directly would give a different puzzle to every user every time. Server-generated puzzles require a database and add latency.  
**Solution:** Implemented a date-string-based seed (today's date as a string → numeric hash) passed into a seeded pseudo-random number generator. Every device independently generates the identical puzzle for a given date without any network request.

### 4. Streak Calculation Edge Cases
**Problem:** Streak calculation needed to handle: timezone differences (user in UTC+5:30 vs UTC), puzzle completed at 23:59 vs 00:01, leap years, and the "played today OR yesterday counts" rule.  
**Solution:** Built `calculateStreak()` in `src/lib/date-utils.ts` using UTC-normalised date strings (`yyyy-MM-dd`) so all comparisons are timezone-safe. The function traverses from today backwards and counts consecutive completed dates.

### 5. Auto-Save Without Performance Impact
**Problem:** Saving to IndexedDB on every single keystroke in an 8×8 matrix (64 cells) risked creating a flood of async writes and UI jank.  
**Solution:** Implemented a debounced save (300ms delay after the last keypress) so rapid typing triggers only one write per burst, keeping the UI responsive.

### 6. Score Sync Security
**Problem:** Client-submitted scores could be manipulated (e.g., claiming a 3000-point score in 2 seconds with 0 hints).  
**Solution:** The `/api/sync/daily-scores` endpoint validates every field server-side: future dates rejected, score capped at 3000, completion time must be ≥ 5 seconds, and rank must be one of the five valid values. Only the best legitimate score per day per user is stored.

---

## Appendix — Project File Structure

```
logic-looper/
├── prisma/
│   └── schema.prisma              # Database models (User, DailyScore, Leaderboard, Achievement)
├── public/
│   ├── logo.png                   # Bluestock.in brand logo
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service Worker
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ # NextAuth.js handler
│   │   │   └── sync/daily-scores/ # Score sync endpoint
│   │   ├── achievements/page.tsx  # Achievements page (IndexedDB-based)
│   │   ├── leaderboard/page.tsx   # Global leaderboard
│   │   ├── globals.css            # Tailwind + custom animations
│   │   ├── layout.tsx             # Root layout with sidebar
│   │   └── page.tsx               # Home — stats + puzzle + heatmap
│   ├── components/
│   │   ├── activity-heatmap.tsx   # 365-day rank-coloured heatmap
│   │   ├── header.tsx             # Online indicator + streak
│   │   ├── logo.tsx               # Logo component (logo.png + gradient name)
│   │   ├── number-matrix-puzzle   # NumberMatrix with auto-save
│   │   ├── pattern-matching-puzzle.tsx
│   │   ├── puzzle-board.tsx       # Puzzle type router
│   │   ├── puzzle-controls.tsx    # Timer, hints, validate, confetti
│   │   ├── sequence-solver-puzzle.tsx
│   │   ├── service-worker-registrar.tsx
│   │   └── sidebar-nav.tsx        # Navigation sidebar
│   ├── hooks/
│   │   ├── use-online-status.ts   # Online/offline detection
│   │   └── use-puzzle-timer.ts    # Timer start/stop/reset
│   └── lib/
│       ├── actions.ts             # Server actions (puzzle gen, hints, save)
│       ├── auth.ts                # NextAuth config
│       ├── date-utils.ts          # Streak & date helpers
│       ├── indexeddb.ts           # IndexedDB wrapper
│       ├── puzzle-validators.ts   # Client-side solution validation
│       ├── scoring.ts             # Score formula & rank calculation
│       └── static-puzzles.ts     # Deterministic puzzle generator
```

---

*Document generated: February 20, 2026*  
*Logic Looper — Built during Bluestock.in Internship Programme*
