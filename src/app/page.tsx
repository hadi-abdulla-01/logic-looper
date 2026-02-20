'use client';

import { useEffect, useState } from 'react';
import { PuzzleBoard } from '@/components/puzzle-board';
import { ActivityHeatmap } from '@/components/activity-heatmap';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { migrateFromLocalStorage, getUserProgress, getCompletedDates } from '@/lib/indexeddb';
import { calculateStreak, getTodayDate, getDaysInYear } from '@/lib/date-utils';
import { Flame, Trophy, Brain, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Stats {
  streak: number;
  totalSolved: number;
  totalScore: number;
  averageTime: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    streak: 0,
    totalSolved: 0,
    totalScore: 0,
    averageTime: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const today = getTodayDate();
  const currentYear = new Date().getFullYear();
  const daysInYear = getDaysInYear(currentYear);

  // Migrate data from localStorage to IndexedDB on first load
  useEffect(() => {
    migrateFromLocalStorage().catch(console.error);
  }, []);

  const loadStats = async () => {
    try {
      const [progress, completedDates] = await Promise.all([
        getUserProgress(),
        getCompletedDates(),
      ]);
      const streak = calculateStreak(completedDates);
      setStats({
        streak,
        totalSolved: progress.totalPuzzlesSolved,
        totalScore: progress.totalScore,
        averageTime: progress.averageTime,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Refresh stats when a puzzle is completed
    const handler = () => loadStats();
    window.addEventListener('puzzle-completed', handler);
    return () => window.removeEventListener('puzzle-completed', handler);
  }, []);

  const formatAverageTime = (seconds: number) => {
    if (seconds === 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const statCards = [
    {
      label: 'Current Streak',
      value: stats.streak > 0 ? `${stats.streak}` : '0',
      suffix: 'days',
      icon: Flame,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      showFire: stats.streak >= 3,
    },
    {
      label: 'Puzzles Solved',
      value: stats.totalSolved.toString(),
      suffix: `/ ${daysInYear}`,
      icon: Brain,
      color: 'text-primary',
      bgColor: 'bg-primary/5',
      showFire: false,
    },
    {
      label: 'Total Score',
      value: stats.totalScore > 0 ? stats.totalScore.toLocaleString() : '0',
      suffix: 'pts',
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      showFire: false,
    },
    {
      label: 'Avg. Time',
      value: formatAverageTime(stats.averageTime),
      suffix: '',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      showFire: false,
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Daily Puzzle</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        {stats.streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <span className={cn("text-xl select-none", stats.streak >= 3 && "animate-fire")}>🔥</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {stats.streak} day streak
            </span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <Card key={card.label} className={cn("border-0 shadow-sm", card.bgColor)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={cn("text-2xl font-bold tabular-nums", card.color)}>
                      {isLoadingStats ? '—' : card.value}
                    </span>
                    {card.suffix && (
                      <span className="text-xs text-muted-foreground">{card.suffix}</span>
                    )}
                  </div>
                </div>
                <div className={cn("p-2 rounded-lg", card.bgColor)}>
                  <card.icon className={cn("h-4 w-4", card.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Puzzle Board */}
      <PuzzleBoard />

      {/* Activity Heatmap */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Activity — {currentYear}
              </CardTitle>
              <CardDescription className="mt-1">
                {stats.totalSolved} of {daysInYear} days played this year
              </CardDescription>
            </div>
            {stats.totalSolved > 0 && (
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">
                  {Math.round((stats.totalSolved / daysInYear) * 100)}%
                </span>
                <p className="text-xs text-muted-foreground">completion</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap />
        </CardContent>
      </Card>
    </div>
  );
}
