import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sync/daily-scores
 * Syncs a completed puzzle score to the server.
 * - Upserts (best score wins for the day)
 * - Validates inputs server-side
 * - Prevents duplicate entries for the same day
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { date, puzzleType, difficulty, score, timeInSeconds, rank, hintsUsed } = body;

        // --- Security Validation ---

        // 1. Validate required fields
        if (!date || !puzzleType || !difficulty || score === undefined || !timeInSeconds || !rank) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 2. Reject future dates
        const today = new Date().toISOString().split('T')[0];
        if (date > today) {
            return NextResponse.json({ error: 'Cannot sync scores for future dates' }, { status: 422 });
        }

        // 3. Reject invalid score range (0 to max possible = 1000 base * 2x time * 100 perfect = ~2100)
        if (score < 0 || score > 3000) {
            return NextResponse.json({ error: 'Invalid score range' }, { status: 422 });
        }

        // 4. Reject unrealistic completion time (< 5 seconds is suspicious)
        if (timeInSeconds < 5) {
            return NextResponse.json({ error: 'Unrealistic completion time' }, { status: 422 });
        }

        // 5. Reject invalid rank
        if (!['S', 'A', 'B', 'C', 'D'].includes(rank)) {
            return NextResponse.json({ error: 'Invalid rank' }, { status: 422 });
        }

        // --- Upsert Logic (best score wins) ---
        const existing = await prisma.dailyScore.findFirst({
            where: {
                userId: session.user.id,
                date,
            },
            orderBy: { score: 'desc' },
        });

        let dailyScore;

        if (existing) {
            if (score > existing.score) {
                // Update only if new score is higher
                dailyScore = await prisma.dailyScore.update({
                    where: { id: existing.id },
                    data: {
                        score,
                        timeInSeconds,
                        rank,
                        hintsUsed: hintsUsed ?? 0,
                        puzzleType,
                        difficulty,
                    },
                });
            } else {
                // Keep existing (already has a better score for today)
                dailyScore = existing;
            }
        } else {
            // Create new record
            dailyScore = await prisma.dailyScore.create({
                data: {
                    userId: session.user.id,
                    date,
                    puzzleType,
                    difficulty,
                    score,
                    timeInSeconds,
                    rank,
                    hintsUsed: hintsUsed ?? 0,
                    synced: true,
                },
            });
        }

        // --- Update leaderboard ---
        try {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { name: true, image: true },
            });

            await prisma.leaderboard.upsert({
                where: { date_userId: { date, userId: session.user.id } },
                update: { score: Math.max(score, existing?.score ?? 0) },
                create: {
                    date,
                    userId: session.user.id,
                    userName: user?.name || 'Player',
                    userImage: user?.image,
                    score,
                    rank: 0, // will be recalculated dynamically
                },
            });
        } catch (lbErr) {
            console.warn('Leaderboard update failed (non-critical):', lbErr);
        }

        // --- Recalculate and update user stats ---
        try {
            const userScores = await prisma.dailyScore.findMany({
                where: { userId: session.user.id },
                orderBy: { date: 'desc' },
                select: { date: true, score: true, timeInSeconds: true },
            });

            // Calculate streak
            let streak = 0;
            const sortedDates = [...new Set(userScores.map((s) => s.date))].sort().reverse();

            if (sortedDates.length > 0) {
                let expectedDate = today;
                for (const scoreDate of sortedDates) {
                    if (scoreDate === expectedDate) {
                        streak++;
                        const d = new Date(expectedDate);
                        d.setDate(d.getDate() - 1);
                        expectedDate = d.toISOString().split('T')[0];
                    } else if (scoreDate < expectedDate) {
                        break;
                    }
                }
            }

            const totalScore = userScores.reduce((sum, s) => sum + s.score, 0);
            const avgTime = Math.round(
                userScores.reduce((sum, s) => sum + s.timeInSeconds, 0) / userScores.length
            );

            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    streak,
                    lastPlayedDate: date,
                    totalPuzzlesSolved: sortedDates.length,
                    totalScore,
                    averageTime: avgTime,
                },
            });

            return NextResponse.json({ success: true, dailyScore, streak });
        } catch (statsErr) {
            console.error('Failed to update user stats:', statsErr);
            return NextResponse.json({ success: true, dailyScore, streak: 0 });
        }
    } catch (error) {
        console.error('Error syncing daily score:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * GET /api/sync/daily-scores
 * Returns last 365 days of scores for the logged-in user
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const scores = await prisma.dailyScore.findMany({
            where: { userId: session.user.id },
            orderBy: { date: 'desc' },
            take: 365,
        });

        return NextResponse.json({ scores });
    } catch (error) {
        console.error('Error fetching scores:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
