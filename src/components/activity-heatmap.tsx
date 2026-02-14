'use client';

import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { eachDayOfInterval, startOfYear, endOfYear, format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { getAllRecords } from '@/lib/indexeddb';
import type { DailyActivityRecord } from '@/lib/indexeddb';

export function ActivityHeatmap() {
  const [activityData, setActivityData] = useState<Map<string, DailyActivityRecord>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      try {
        const activities = await getAllRecords<DailyActivityRecord>('dailyActivity');
        const activityMap = new Map<string, DailyActivityRecord>();
        activities.forEach((activity) => {
          activityMap.set(activity.date, activity);
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

  const getIntensity = (activity?: DailyActivityRecord): number => {
    if (!activity || !activity.completed) return 0;

    // Map rank to intensity (0-4)
    const rankMap: Record<string, number> = {
      'S': 4, // Exceptional
      'A': 3, // Excellent
      'B': 2, // Good
      'C': 1, // Average
      'D': 1, // Below average
    };

    return rankMap[activity.rank] || 1;
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

  const getTooltipText = (date: Date, activity?: DailyActivityRecord) => {
    const formattedDate = format(date, 'MMMM d, yyyy');

    if (!activity || !activity.completed) {
      return `No puzzle solved on ${formattedDate}`;
    }

    return (
      <div className="space-y-1">
        <p className="font-semibold">{formattedDate}</p>
        <p>Score: {activity.score}</p>
        <p>Rank: {activity.rank}</p>
        <p>Time: {Math.floor(activity.timeInSeconds / 60)}:{(activity.timeInSeconds % 60).toString().padStart(2, '0')}</p>
        <p className="text-xs text-muted-foreground">{activity.puzzleType}</p>
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
            const activity = activityData.get(dateString);
            const intensity = getIntensity(activity);
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
                  {getTooltipText(day, activity)}
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
