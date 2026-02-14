import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        // Get top 100 scores for the date
        const topScores = await prisma.dailyScore.findMany({
            where: { date },
            orderBy: { score: 'desc' },
            take: 100,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        // Format leaderboard
        const leaderboard = topScores.map((score: any, index: number) => ({
            rank: index + 1,
            userId: score.user.id,
            userName: score.user.name || 'Anonymous',
            userImage: score.user.image,
            score: score.score,
            timeInSeconds: score.timeInSeconds,
            rankGrade: score.rank,
            puzzleType: score.puzzleType,
        }));

        return NextResponse.json({ leaderboard, date });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
