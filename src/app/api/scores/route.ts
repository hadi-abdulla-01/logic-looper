import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { date, puzzleType, difficulty, score, timeInSeconds, rank, hintsUsed } = body;

        // Validate input
        if (!date || !puzzleType || !difficulty || score === undefined || !timeInSeconds || !rank) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if score already exists for this date
        const existing = await prisma.dailyScore.findUnique({
            where: {
                userId_date: {
                    userId: session.user.id,
                    date,
                },
            },
        });

        let dailyScore;

        if (existing) {
            // Update if new score is higher
            if (score > existing.score) {
                dailyScore = await prisma.dailyScore.update({
                    where: { id: existing.id },
                    data: {
                        score,
                        timeInSeconds,
                        rank,
                        hintsUsed,
                        puzzleType,
                        difficulty,
                    },
                });
            } else {
                dailyScore = existing;
            }
        } else {
            // Create new score
            dailyScore = await prisma.dailyScore.create({
                data: {
                    userId: session.user.id,
                    date,
                    puzzleType,
                    difficulty,
                    score,
                    timeInSeconds,
                    rank,
                    hintsUsed,
                },
            });
        }

        // Update user stats
        const userScores = await prisma.dailyScore.findMany({
            where: { userId: session.user.id },
            orderBy: { date: 'desc' },
        });

        // Calculate streak
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        const sortedDates = userScores.map(s => s.date).sort().reverse();

        if (sortedDates.length > 0) {
            let expectedDate = today;
            for (const scoreDate of sortedDates) {
                if (scoreDate === expectedDate) {
                    streak++;
                    const date = new Date(expectedDate);
                    date.setDate(date.getDate() - 1);
                    expectedDate = date.toISOString().split('T')[0];
                } else {
                    break;
                }
            }
        }

        // Update user
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                streak,
                lastPlayedDate: date,
                totalPuzzlesSolved: userScores.length,
                totalScore: userScores.reduce((sum, s) => sum + s.score, 0),
                averageTime: Math.round(
                    userScores.reduce((sum, s) => sum + s.timeInSeconds, 0) / userScores.length
                ),
            },
        });

        return NextResponse.json({
            success: true,
            dailyScore,
            streak,
        });
    } catch (error) {
        console.error('Error saving score:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const scores = await prisma.dailyScore.findMany({
            where: { userId: session.user.id },
            orderBy: { date: 'desc' },
            take: 365, // Last year
        });

        return NextResponse.json({ scores });
    } catch (error) {
        console.error('Error fetching scores:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
