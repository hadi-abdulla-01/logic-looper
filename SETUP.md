# Logic Looper Setup

## Prerequisites

- Node.js 18+
- npm
- Google OAuth credentials
- PostgreSQL database (Neon or equivalent)

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment variables

Create `.env.local` in project root:

```env
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=replace_with_random_secret
GOOGLE_CLIENT_ID=replace_with_google_client_id
GOOGLE_CLIENT_SECRET=replace_with_google_client_secret
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

Generate a secret with:

```bash
openssl rand -base64 32
```

## 3) Prepare database

```bash
npx prisma generate
npx prisma db push
```

## 4) Run app

```bash
npm run dev
```

Open `http://localhost:9002`.

## 5) Validate critical paths

1. Visit `/login`.
2. Sign in with Google.
3. Solve one puzzle.
4. Confirm `POST /api/sync/daily-scores` succeeds in network panel.
5. Confirm leaderboard page shows updated score.

## Common issues

### OAuth redirect mismatch

Ensure Google OAuth redirect URI includes:

- `http://localhost:9002/api/auth/callback/google`

### Prisma client errors

Run:

```bash
npx prisma generate
```

### Database connection failure

Verify `DATABASE_URL` and DB availability.
