# Logic Looper Status

**Last updated:** April 4, 2026

## Current status

- ✅ Header sign-in now supports direct Google authentication.
- ✅ Sidebar profile section includes sign-in CTA for guest users.
- ✅ Optional `/login` route remains available for explicit auth entry.
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
