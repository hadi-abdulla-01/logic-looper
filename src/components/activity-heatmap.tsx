'use client';

import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { eachDayOfInterval, startOfYear, endOfYear, format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { getAllRecords } from '@/lib/indexeddb';
import type { DailyActivityRecord } from '@/lib/indexeddb';

export function ActivityHeatmap() {
  const [activityData, setActivityData] = useState<Map<string, { count: number; latest: DailyActivityRecord }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      try {
        const activities = await getAllRecords<DailyActivityRecord>('dailyActivity');
        const activityMap = new Map<string, { count: number; latest: DailyActivityRecord }>();

        activities.forEach((activity) => {
          const current = activityMap.get(activity.date);
          if (current) {
            activityMap.set(activity.date, {
              count: current.count + 1,
              latest: activity // Assuming activities are loaded in order, or we could compare timestamps
            });
          } else {
            activityMap.set(activity.date, {
              count: 1,
              latest: activity
            });
          }
        });
        setActivityData(activityMap);
      } catch (error) {
        console.error('Failed to load activity data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, []);

  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = endOfYear(today);

  const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

  const getIntensity = (data?: { count: number }): number => {
    if (!data || data.count === 0) return 0;

    // Frequency based mapping
    if (data.count === 1) return 1;
    if (data.count === 2) return 2;
    if (data.count >= 3 && data.count < 5) return 3;
    if (data.count >= 5) return 4;
    return 1;
  };

  const getIntensityColor = (intensity: number): string => {
    switch (intensity) {
      case 0: return 'bg-muted';
      case 1: return 'bg-primary/40';
      case 2: return 'bg-primary/60';
      case 3: return 'bg-primary/80';
      case 4: return 'bg-primary';
      default: return 'bg-muted';
    }
  };

  const getTooltipText = (date: Date, data?: { count: number; latest: DailyActivityRecord }) => {
    const formattedDate = format(date, 'MMMM d, yyyy');

    if (!data || data.count === 0) {
      return `No puzzle solved on ${formattedDate}`;
    }

    const { count, latest } = data;

    return (
      <div className="space-y-1">
        <p className="font-semibold">{formattedDate}</p>
        <p className="font-medium text-primary">{count} {count === 1 ? 'puzzle' : 'puzzles'} solved</p>
        <div className="pt-1 border-t border-border mt-1">
          <p className="text-xs text-muted-foreground">Latest:</p>
          <p>Score: {latest.score}</p>
          <p>Rank: {latest.rank}</p>
          <p>Time: {Math.floor(latest.timeInSeconds / 60)}:{(latest.timeInSeconds % 60).toString().padStart(2, '0')}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading activity...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <div className="grid grid-rows-7 grid-flow-col gap-1">
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
                      'h-3 w-3 rounded-sm sm:h-4 sm:w-4 transition-all hover:scale-110',
                      getIntensityColor(intensity),
                      isToday && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background'
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {getTooltipText(day, data)}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="flex justify-end items-center gap-2 text-sm sm:flex-col sm:items-start sm:justify-center">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-muted rounded-sm" />
            <span>Less</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-primary/40 rounded-sm" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-primary/60 rounded-sm" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-primary/80 rounded-sm" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 bg-primary rounded-sm" />
            <span>More</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
