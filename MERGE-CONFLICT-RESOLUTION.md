# Merge Conflict Resolution Guide (README.md / SETUP.md / STATUS.md / src/components/header.tsx)

If GitHub shows conflicts in these files, resolve locally with the steps below.

## 1) Start from your PR branch

```bash
git checkout <your-pr-branch>
git fetch origin
git merge origin/main
```

## 2) Resolve each conflict by keeping the current UX decisions

### README.md
Keep:
- Guest-first app entry on `/`
- Direct **Sign In with Google** from header/sidebar
- Optional `/login` route (not mandatory)

### SETUP.md
Keep:
- Validation steps starting from `/`
- Sign-in initiated from header/sidebar

### STATUS.md
Keep:
- Direct Google sign-in in header
- Sidebar guest profile CTA
- Optional `/login` route

### src/components/header.tsx
Keep:
- `signIn('google', { callbackUrl: '/' })` actions
- Header button text `Sign In with Google`
- Guest dropdown action `Sign in to sync progress`

## 3) Finish merge

```bash
git add README.md SETUP.md STATUS.md src/components/header.tsx
git commit -m "Resolve merge conflicts for docs and header auth flow"
git push origin <your-pr-branch>
```

## 4) Re-run checks

```bash
npm run typecheck
npm run build
```

(If lint prompts for interactive setup, complete ESLint setup in repo first, then run lint.)
