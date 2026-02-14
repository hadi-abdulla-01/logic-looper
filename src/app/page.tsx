'use client';

import { useEffect } from 'react';
import { PuzzleBoard } from '@/components/puzzle-board';
import { ActivityHeatmap } from '@/components/activity-heatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { migrateFromLocalStorage } from '@/lib/indexeddb';

export default function Home() {
  // Migrate data from localStorage to IndexedDB on first load
  useEffect(() => {
    migrateFromLocalStorage().catch(console.error);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PuzzleBoard />
      <Card>
        <CardHeader>
          <CardTitle>Your Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap />
        </CardContent>
      </Card>
    </div>
  );
}
