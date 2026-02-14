'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDailyPuzzle as generateStaticPuzzle } from '@/lib/static-puzzles';
import { DailyPuzzle } from '@/lib/types';

export async function updateUserStats(input: {
  streak: number;
  totalPuzzlesSolved: number;
  totalScore: number;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        streak: input.streak,
        totalPuzzlesSolved: input.totalPuzzlesSolved,
        totalScore: input.totalScore,
        lastPlayedDate: new Date().toISOString(),
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update user stats:", error);
    return { success: false, error: "Database update failed" };
  }
}

export async function savePuzzleCompletion(input: {
  date: string;
  puzzleType: string;
  difficulty: string;
  score: number;
  timeInSeconds: number;
  rank: string;
  hintsUsed: number;
  // User stats to update simultaneously
  userStats: {
    streak: number;
    totalPuzzlesSolved: number;
    totalScore: number;
  }
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // 1. Create new DailyScore record (History)
    await prisma.dailyScore.create({
      data: {
        userId: session.user.id,
        date: input.date,
        score: input.score,
        timeInSeconds: input.timeInSeconds,
        rank: input.rank,
        hintsUsed: input.hintsUsed,
        puzzleType: input.puzzleType,
        difficulty: input.difficulty,
        synced: true
      }
    });

    // 2. Update Leaderboard Table (Daily Aggregate)
    // We fetch current user info first to get name/image
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true }
    });

    // Upsert Leaderboard entry for today
    await prisma.leaderboard.upsert({
      where: {
        date_userId: {
          date: input.date,
          userId: session.user.id
        }
      },
      update: {
        score: { increment: input.score }, // Accumulate score
        rank: 0 // Rank will be recalculated dynamically or handle separately
      },
      create: {
        date: input.date,
        userId: session.user.id,
        userName: user?.name || 'Player',
        userImage: user?.image,
        score: input.score,
        rank: 0
      }
    });

    // 2. Update User Stats
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        streak: input.userStats.streak,
        totalPuzzlesSolved: input.userStats.totalPuzzlesSolved,
        totalScore: input.userStats.totalScore,
        lastPlayedDate: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to save puzzle completion:", error);
    return { success: false, error: "Database save failed" };
  }
}

export async function getLeaderboardData() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        totalScore: true,
        streak: true,
      },
      orderBy: {
        totalScore: 'desc',
      },
      take: 10,
    });

    // Transform null names to 'Anonymous' or generic
    return users.map((user: { id: string, name: string | null, image: string | null, totalScore: number, streak: number }, index: number) => ({
      ...user,
      rank: index + 1,
      name: user.name || `Player ${user.id.substring(0, 4)}`,
    }));
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return [];
  }
}

export async function generateDailyPuzzle(input: { date: string; userProgressionLevel?: number }): Promise<DailyPuzzle> {
  // Use static puzzle generator instead of AI
  // We ignore userProgressionLevel for now
  return generateStaticPuzzle(input.date);
}

export async function getContextualPuzzleHint(input: {
  puzzleType: string;
  currentState: any;
  hintsUsed: number;
}): Promise<{ hint: string; hintCategory: string }> {
  // Simple static hints
  const hints = [
    { hint: "Look for patterns in the rows and columns.", category: "Strategy" },
    { hint: "Try filling in the cells with only one possible value.", category: "Logic" },
    { hint: "Check if any numbers are missing from a row or column.", category: "Observation" },
    { hint: "Focus on the cells that have the fewest possibilities.", category: "Optimization" },
  ];

  const selected = hints[input.hintsUsed % hints.length] || hints[0];

  return {
    hint: selected.hint,
    hintCategory: selected.category
  };
}
