# **App Name**: Logic Loop

## Core Features:

- Daily Puzzle Generation: Generate a new logic puzzle each day based on the date, ensuring unique challenges using a deterministic algorithm as a tool.
- Puzzle Solver & Validator: Validate the solution to the puzzle client-side, and allow users to input possible solutions using interactive elements.
- Streak Tracking: Track the user's daily puzzle completion streak and display it visually with a heatmap. Saves data into IndexedDB.
- User Authentication: Allow users to log in with Google OAuth 2.0 or Truecaller SDK, and provide a guest mode option, using NextAuth.js.
- Daily Leaderboard: Display the top 100 daily scores on a leaderboard, updated once per day, with data saved to PostgreSQL via Prisma.
- Puzzle Sharing: Enable users to share puzzle states with friends via unique URLs, that capture game state.
- Achievement System: Award achievements based on milestones and puzzle-solving skills, tracked client-side. Awards badges.

## Style Guidelines:

- Primary color: Dark electric blue (#414BEA) to give the application a modern, sleek, trustworthy feel.
- Background color: Very light gray (#F6F5F5) for a clean and unobtrusive backdrop.
- Accent color: Electric Indigo (#7752FE) to provide an additional option for highlighting.
- Body and headline font: 'Poppins' (sans-serif) for a clean, modern user interface. Note: currently only Google Fonts are supported.
- Use icons from Font Awesome, Bootstrap Icons and Flaticon.
- Maintain a clean and structured layout with intuitive navigation for easy puzzle selection and progress tracking.
- Incorporate subtle animations using Framer Motion for engaging transitions and feedback.