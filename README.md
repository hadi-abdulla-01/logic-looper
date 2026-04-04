# Logic Looper

Logic Looper is an offline-capable daily puzzle game built with Next.js. Players can play as a guest, or sign in with Google to sync progress and scores across devices.

## What is included

- Daily puzzle gameplay with multiple puzzle types.
- Guest mode with local persistence in IndexedDB.
- Google login with NextAuth.
- Server sync for daily scores and user stats (streak, total solved, total score, average time).
- Leaderboard and achievements pages.

## Login flow

A dedicated login page is available at:

- `/login`

How it works:

1. Header **Sign In** goes to `/login`.
2. `/login` provides:
   - **Continue with Google** (cloud sync enabled)
   - **Continue as Guest** (local-only, can sign in later)
3. NextAuth is configured to use `/login` for sign-in and error pages.

## Data storage model

Logic Looper uses a hybrid storage model.

### Local storage (guest + offline)

- IndexedDB database: `LogicLooperDB`
- Key stores:
  - `puzzles`
  - `dailyActivity`
  - `achievements`
  - `userProgress`
  - `settings`

Local data allows gameplay when offline and supports sync when the user signs in and reconnects.

### Cloud storage (authenticated users)

Prisma/PostgreSQL tables:

- `User`
- `DailyScore`
- `Leaderboard`
- NextAuth tables (`Account`, `Session`, `VerificationToken`)

APIs used for persistence:

- `POST /api/sync/daily-scores`
- `GET /api/sync/daily-scores`
- `GET /api/leaderboard`

## Quick setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` and set:

```env
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=replace_me
GOOGLE_CLIENT_ID=replace_me
GOOGLE_CLIENT_SECRET=replace_me
DATABASE_URL=postgresql://...
```

3. Generate Prisma client and apply schema:

```bash
npx prisma generate
npx prisma db push
```

4. Start app:

```bash
npm run dev
```

5. Open:

- `http://localhost:9002`

## Verification checklist (login + data storage)

### A) Login page verification

- Open `/login` and confirm page loads.
- Click **Continue with Google** and verify OAuth redirect.
- Confirm returning authenticated session lands on `/`.

### B) Guest local persistence verification

- Play as guest and complete a puzzle.
- Reload app.
- Confirm streak/solved state is retained.
- In browser devtools, verify IndexedDB contains records in `dailyActivity` and `userProgress`.

### C) Cloud sync verification

- Sign in with Google.
- Complete a puzzle.
- Verify network call to `POST /api/sync/daily-scores` returns success.
- Verify leaderboard updates for current date.
- Verify user aggregate stats update (streak/totalScore/totalPuzzlesSolved).

### D) Offline/online sync behavior

- Go offline.
- Complete puzzle(s) as signed-in user.
- Reconnect.
- Confirm sync indicator appears and records are pushed to server.

## Developer commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

## Notes

- This project currently uses static puzzle generation logic in app code.
- If OAuth or DB is not configured, guest mode still works locally.
