# Logic Looper Status

**Last updated:** April 4, 2026

## Current status

- ✅ Dedicated login route implemented at `/login`.
- ✅ Header sign-in now routes to `/login`.
- ✅ NextAuth sign-in and error pages configured to `/login`.
- ✅ Documentation refreshed to reflect current auth + storage behavior.

## Data storage status

- ✅ Local persistence: IndexedDB for guest/offline usage.
- ✅ Cloud persistence: Prisma/PostgreSQL for authenticated score and stat sync.
- ✅ Sync endpoint in place: `/api/sync/daily-scores`.

## Required external configuration

- Google OAuth client ID/secret.
- PostgreSQL connection string.
- NextAuth secret.

Without these, guest play still works locally.
