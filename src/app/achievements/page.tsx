'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Award, BrainCircuit, Calendar, Flame, Zap, Star, Target, Shield, Rocket, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getUserProgress, getCompletedDates, getAllRecords } from '@/lib/indexeddb';
import type { DailyActivityRecord } from '@/lib/indexeddb';
import { calculateStreak } from '@/lib/date-utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'streak' | 'completion' | 'speed' | 'perfect' | 'score';
  check: (stats: UserStats) => boolean;
  progress: (stats: UserStats) => { current: number; target: number };
}

interface UserStats {
  streak: number;
  totalPuzzlesSolved: number;
  totalScore: number;
  averageTime: number;
  hasPerfectRun: boolean;
  sRankCount: number;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_solve',
    name: 'Puzzle Pioneer',
    description: 'Solve your first puzzle.',
    icon: Award,
    category: 'completion',
    check: (s) => s.totalPuzzlesSolved >= 1,
    progress: (s) => ({ current: Math.min(s.totalPuzzlesSolved, 1), target: 1 }),
  },
  {
    id: 'five_puzzles',
    name: 'Getting Warmed Up',
    description: 'Solve 5 puzzles.',
    icon: Target,
    category: 'completion',
    check: (s) => s.totalPuzzlesSolved >= 5,
    progress: (s) => ({ current: Math.min(s.totalPuzzlesSolved, 5), target: 5 }),
  },
  {
    id: 'twenty_five_puzzles',
    name: 'Dedicated Solver',
    description: 'Solve 25 puzzles.',
    icon: BrainCircuit,
    category: 'completion',
    check: (s) => s.totalPuzzlesSolved >= 25,
    progress: (s) => ({ current: Math.min(s.totalPuzzlesSolved, 25), target: 25 }),
  },
  {
    id: 'fifty_puzzles',
    name: 'Logic Lord',
    description: 'Solve 50 puzzles.',
    icon: Crown,
    category: 'completion',
    check: (s) => s.totalPuzzlesSolved >= 50,
    progress: (s) => ({ current: Math.min(s.totalPuzzlesSolved, 50), target: 50 }),
  },
  {
    id: 'streak_3',
    name: 'On a Roll',
    description: 'Maintain a 3-day streak.',
    icon: Flame,
    category: 'streak',
    check: (s) => s.streak >= 3,
    progress: (s) => ({ current: Math.min(s.streak, 3), target: 3 }),
  },
  {
    id: 'streak_7',
    name: 'Weekly Warrior',
    description: 'Maintain a 7-day streak.',
    icon: Flame,
    category: 'streak',
    check: (s) => s.streak >= 7,
    progress: (s) => ({ current: Math.min(s.streak, 7), target: 7 }),
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak.',
    icon: Calendar,
    category: 'streak',
    check: (s) => s.streak >= 30,
    progress: (s) => ({ current: Math.min(s.streak, 30), target: 30 }),
  },
  {
    id: 'streak_100',
    name: 'Century Club',
    description: 'Maintain a 100-day streak.',
    icon: Shield,
    category: 'streak',
    check: (s) => s.streak >= 100,
    progress: (s) => ({ current: Math.min(s.streak, 100), target: 100 }),
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Average under 3 minutes per puzzle.',
    icon: Zap,
    category: 'speed',
    check: (s) => s.totalPuzzlesSolved > 0 && s.averageTime > 0 && s.averageTime < 180,
    progress: (s) => ({
      current: s.averageTime > 0 ? Math.max(0, 180 - s.averageTime) : 0,
      target: 180,
    }),
  },
  {
    id: 'perfect_run',
    name: 'Flawless',
    description: 'Complete a puzzle with no hints used.',
    icon: Star,
    category: 'perfect',
    check: (s) => s.hasPerfectRun,
    progress: (s) => ({ current: s.hasPerfectRun ? 1 : 0, target: 1 }),
  },
  {
    id: 's_rank',
    name: 'S-Rank Legend',
    description: 'Achieve an S rank on any puzzle.',
    icon: Rocket,
    category: 'perfect',
    check: (s) => s.sRankCount >= 1,
    progress: (s) => ({ current: Math.min(s.sRankCount, 1), target: 1 }),
  },
  {
    id: 's_rank_5',
    name: 'Elite Mind',
    description: 'Achieve S rank on 5 puzzles.',
    icon: Crown,
    category: 'perfect',
    check: (s) => s.sRankCount >= 5,
    progress: (s) => ({ current: Math.min(s.sRankCount, 5), target: 5 }),
  },
  {
    id: 'score_1000',
    name: 'Point Hoarder',
    description: 'Accumulate 1,000 total points.',
    icon: Star,
    category: 'score',
    check: (s) => s.totalScore >= 1000,
    progress: (s) => ({ current: Math.min(s.totalScore, 1000), target: 1000 }),
  },
  {
    id: 'score_10000',
    name: 'Score Master',
    description: 'Accumulate 10,000 total points.',
    icon: Crown,
    category: 'score',
    check: (s) => s.totalScore >= 10000,
    progress: (s) => ({ current: Math.min(s.totalScore, 10000), target: 10000 }),
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  streak: 'text-amber-500',
  completion: 'text-blue-500',
  speed: 'text-green-500',
  perfect: 'text-purple-500',
  score: 'text-yellow-500',
};

export default function AchievementsPage() {
  const [userStats, setUserStats] = useState<UserStats>({
    streak: 0,
    totalPuzzlesSolved: 0,
    totalScore: 0,
    averageTime: 0,
    hasPerfectRun: false,
    sRankCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [progress, completedDates, activities] = await Promise.all([
          getUserProgress(),
          getCompletedDates(),
          getAllRecords<DailyActivityRecord>('dailyActivity'),
        ]);

        const streak = calculateStreak(completedDates);
        const hasPerfectRun = activities.some((a) => a.rank === 'S' || (a.rank !== 'D' && a.score > 0));
        const sRankCount = activities.filter((a) => a.rank === 'S').length;

        setUserStats({
          streak,
          totalPuzzlesSolved: progress.totalPuzzlesSolved,
          totalScore: progress.totalScore,
          averageTime: progress.averageTime,
          hasPerfectRun,
          sRankCount,
        });
      } catch (error) {
        console.error('Failed to load achievement stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();

    // Refresh on puzzle completion
    const handler = () => loadStats();
    window.addEventListener('puzzle-completed', handler);
    return () => window.removeEventListener('puzzle-completed', handler);
  }, []);

  const unlockedCount = ACHIEVEMENTS.filter((a) => a.check(userStats)).length;

  const grouped = ACHIEVEMENTS.reduce<Record<string, AchievementDef[]>>((acc, ach) => {
    if (!acc[ach.category]) acc[ach.category] = [];
    acc[ach.category].push(ach);
    return acc;
  }, {});

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Your Achievements
          </CardTitle>
          <CardDescription>
            Track your puzzle milestones and unlock all achievements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-4xl font-bold text-primary tabular-nums">
                {unlockedCount}
                <span className="text-lg text-muted-foreground font-normal"> / {ACHIEVEMENTS.length}</span>
              </span>
              <span className="text-sm text-muted-foreground">achievements unlocked</span>
            </div>
            <div className="flex-1">
              <Progress
                value={(unlockedCount / ACHIEVEMENTS.length) * 100}
                className="h-3"
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Streak', value: `${userStats.streak} days`, emoji: '🔥' },
              { label: 'Solved', value: userStats.totalPuzzlesSolved, emoji: '🧩' },
              { label: 'Score', value: userStats.totalScore.toLocaleString(), emoji: '⭐' },
              { label: 'S Ranks', value: userStats.sRankCount, emoji: '🏆' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center p-3 rounded-lg bg-background/60 border"
              >
                <span className="text-xl">{stat.emoji}</span>
                <span className="text-sm font-bold tabular-nums">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements by category */}
      <TooltipProvider>
        {Object.entries(grouped).map(([category, achievements]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className={cn(
                "text-base font-semibold capitalize flex items-center gap-2",
                CATEGORY_COLORS[category]
              )}>
                {category === 'streak' && <Flame className="h-4 w-4" />}
                {category === 'completion' && <BrainCircuit className="h-4 w-4" />}
                {category === 'speed' && <Zap className="h-4 w-4" />}
                {category === 'perfect' && <Star className="h-4 w-4" />}
                {category === 'score' && <Crown className="h-4 w-4" />}
                {category.charAt(0).toUpperCase() + category.slice(1)} Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {achievements.map((achievement) => {
                  const unlocked = achievement.check(userStats);
                  const { current, target } = achievement.progress(userStats);
                  const progressPct = Math.min((current / target) * 100, 100);
                  const Icon = achievement.icon;

                  return (
                    <Tooltip key={achievement.id} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'flex flex-col items-center justify-center gap-2 p-4 border rounded-xl transition-all cursor-default select-none',
                            'hover:scale-105 hover:shadow-md',
                            unlocked
                              ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/20 border-amber-300 dark:border-amber-700 shadow-sm'
                              : 'bg-muted/30 border-border opacity-60 grayscale'
                          )}
                        >
                          <div className={cn(
                            'p-2.5 rounded-full',
                            unlocked ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-muted'
                          )}>
                            <Icon className={cn(
                              'h-8 w-8',
                              unlocked ? 'text-amber-500' : 'text-muted-foreground',
                              unlocked && achievement.category === 'streak' && 'animate-fire'
                            )} />
                          </div>
                          <span className={cn(
                            'text-xs font-semibold text-center leading-tight',
                            unlocked ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'
                          )}>
                            {achievement.name}
                          </span>
                          {unlocked ? (
                            <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0">
                              ✓ Unlocked
                            </Badge>
                          ) : (
                            <div className="w-full space-y-1">
                              <div className="w-full bg-muted rounded-full h-1">
                                <div
                                  className="bg-primary/50 h-1 rounded-full transition-all duration-500"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground text-center block">
                                {current}/{target}
                              </span>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px] text-center">
                        <p className="font-semibold">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        {!unlocked && (
                          <p className="text-xs text-primary mt-1">
                            Progress: {current}/{target}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </TooltipProvider>
    </div>
  );
}
