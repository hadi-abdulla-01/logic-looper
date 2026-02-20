'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { eachDayOfInterval, startOfYear, endOfYear, format, isSameDay, getMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { getAllRecords } from '@/lib/indexeddb';
import type { DailyActivityRecord } from '@/lib/indexeddb';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Intensity levels based on rank/score (as per spec):
 * 0 - Not played
 * 1 - Completed (any rank)
 * 2 - Medium difficulty (B rank)
 * 3 - Hard (A rank)
 * 4 - Perfect score (S rank)
 */
function getRankIntensity(rank: string): number {
  switch (rank) {
    case 'S': return 4;
    case 'A': return 3;
    case 'B': return 2;
    case 'C': return 1;
    case 'D': return 1;
    default: return 1;
  }
}

export function ActivityHeatmap() {
  const [activityData, setActivityData] = useState<Map<string, { count: number; best: DailyActivityRecord }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadActivity = useCallback(async () => {
    try {
      const activities = await getAllRecords<DailyActivityRecord>('dailyActivity');
      const activityMap = new Map<string, { count: number; best: DailyActivityRecord }>();

      activities.forEach((activity) => {
        const current = activityMap.get(activity.date);
        if (current) {
          // Keep the best rank for the day
          const currentIntensity = getRankIntensity(current.best.rank);
          const newIntensity = getRankIntensity(activity.rank);
          activityMap.set(activity.date, {
            count: current.count + 1,
            best: newIntensity > currentIntensity ? activity : current.best,
          });
        } else {
          activityMap.set(activity.date, {
            count: 1,
            best: activity,
          });
        }
      });
      setActivityData(activityMap);
    } catch (error) {
      console.error('Failed to load activity data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
  }, [loadActivity, refreshKey]);

  // Listen for custom event to refresh heatmap after puzzle completion
  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener('puzzle-completed', refresh);
    return () => window.removeEventListener('puzzle-completed', refresh);
  }, []);

  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = endOfYear(today);
  const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

  const getIntensity = (data?: { count: number; best: DailyActivityRecord }): number => {
    if (!data || data.count === 0) return 0;
    return getRankIntensity(data.best.rank);
  };

  const getIntensityColor = (intensity: number, isToday: boolean): string => {
    if (isToday && intensity === 0) return 'bg-primary/20 ring-2 ring-primary/50 ring-offset-1 ring-offset-background';
    switch (intensity) {
      case 0: return 'bg-muted hover:bg-muted/80';
      case 1: return 'bg-primary/35 hover:bg-primary/45';
      case 2: return 'bg-primary/55 hover:bg-primary/65';
      case 3: return 'bg-primary/80 hover:bg-primary/90';
      case 4: return 'bg-primary hover:bg-primary/95 shadow-sm shadow-primary/30';
      default: return 'bg-muted';
    }
  };

  const getTooltipText = (date: Date, data?: { count: number; best: DailyActivityRecord }) => {
    const formattedDate = format(date, 'MMM d, yyyy');
    const isToday = isSameDay(date, today);

    if (!data || data.count === 0) {
      return (
        <div className="text-center">
          <p className="font-semibold">{formattedDate}</p>
          {isToday ? (
            <p className="text-primary text-xs">Today — solve to fill this!</p>
          ) : (
            <p className="text-muted-foreground text-xs">No puzzle solved</p>
          )}
        </div>
      );
    }

    const { count, best } = data;
    const timeFormatted = `${Math.floor(best.timeInSeconds / 60)}:${(best.timeInSeconds % 60).toString().padStart(2, '0')}`;

    return (
      <div className="space-y-1 min-w-[140px]">
        <p className="font-semibold text-sm">{formattedDate}</p>
        <p className="text-primary text-xs font-medium">
          {count} {count === 1 ? 'puzzle' : 'puzzles'} solved
        </p>
        <div className="pt-1 border-t border-border mt-1 space-y-0.5">
          <p className="text-xs text-muted-foreground">Best attempt:</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
            <span>Score: <strong>{best.score}</strong></span>
            <span>Rank: <strong className="text-primary">{best.rank}</strong></span>
            <span>Time: <strong>{timeFormatted}</strong></span>
            <span>Type: <strong>{best.puzzleType}</strong></span>
          </div>
        </div>
      </div>
    );
  };

  // Group days by week columns for rendering month labels
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  days.forEach((day) => {
    const dayOfWeek = day.getDay(); // 0=Sun
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // Compute which week index each month starts at
  const monthLabelPositions: { label: string; weekIdx: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wIdx) => {
    const firstDay = week[0];
    const month = getMonth(firstDay);
    if (month !== lastMonth) {
      monthLabelPositions.push({ label: MONTH_LABELS[month], weekIdx: wIdx });
      lastMonth = month;
    }
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-rows-7 grid-flow-col gap-1 opacity-30">
          {Array.from({ length: 52 * 7 }).map((_, i) => (
            <div key={i} className="h-3 w-3 sm:h-4 sm:w-4 rounded-sm bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2 overflow-x-auto pb-2">
        {/* Month labels */}
        <div
          className="relative h-5"
          style={{ minWidth: `${weeks.length * (16 + 4)}px` }}
        >
          {monthLabelPositions.map(({ label, weekIdx }) => (
            <span
              key={`${label}-${weekIdx}`}
              className="absolute text-xs text-muted-foreground"
              style={{ left: `${weekIdx * 20}px` }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-1 pr-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center text-[9px] text-muted-foreground select-none">
                {i % 2 === 1 ? d : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div
            className="grid grid-rows-7 grid-flow-col gap-1"
            style={{ minWidth: `${weeks.length * 20}px` }}
          >
            {days.map((day, index) => {
              const dateString = format(day, 'yyyy-MM-dd');
              const data = activityData.get(dateString);
              const intensity = getIntensity(data);
              const isToday = isSameDay(day, today);

              return (
                <Tooltip key={index} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'h-3 w-3 rounded-sm sm:h-4 sm:w-4 transition-all duration-200 cursor-pointer',
                        'hover:scale-125 hover:z-10',
                        getIntensityColor(intensity, isToday),
                        isToday && intensity > 0 && 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background'
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    {getTooltipText(day, data)}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <div
              key={intensity}
              className={cn(
                'h-3 w-3 rounded-sm',
                intensity === 0 && 'bg-muted',
                intensity === 1 && 'bg-primary/35',
                intensity === 2 && 'bg-primary/55',
                intensity === 3 && 'bg-primary/80',
                intensity === 4 && 'bg-primary',
              )}
            />
          ))}
          <span>More</span>
          <span className="ml-2 text-[10px]">
            Rank S = 🟣 Perfect · A = 🔵 Hard · B = 🟢 Medium · C/D = 🟡 Easy
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
