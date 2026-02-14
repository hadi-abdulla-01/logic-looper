import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            streak?: number;
            totalPuzzlesSolved?: number;
            totalScore?: number;
            progressionLevel?: number;
        };
    }

    interface User {
        id: string;
        streak: number;
        totalPuzzlesSolved: number;
        totalScore: number;
        progressionLevel: number;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string;
        streak?: number;
        totalPuzzlesSolved?: number;
        totalScore?: number;
        progressionLevel?: number;
    }
}
