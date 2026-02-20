'use client';

import { useEffect, useState } from 'react';
import { format, formatDistanceToNow, startOfTomorrow } from 'date-fns';
import { generateDailyPuzzle } from '@/lib/actions';
import type { DailyPuzzle } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NumberMatrixPuzzle } from '@/components/number-matrix-puzzle';
import { PatternMatchingPuzzle } from '@/components/pattern-matching-puzzle';
import { SequenceSolverPuzzle } from '@/components/sequence-solver-puzzle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Brain, Play, CheckCircle2, CalendarDays, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllRecords } from '@/lib/indexeddb';
import { STORES, type DailyActivityRecord } from '@/lib/indexeddb';

const RANK_COLOURS: Record<string, string> = {
  S: 'text-yellow-500',
  A: 'text-green-500',
  B: 'text-blue-500',
  C: 'text-orange-500',
  D: 'text-red-500',
};

const RANK_BG: Record<string, string> = {
  S: 'bg-yellow-500/10 border-yellow-500/30',
  A: 'bg-green-500/10 border-green-500/30',
  B: 'bg-blue-500/10 border-blue-500/30',
  C: 'bg-orange-500/10 border-orange-500/30',
  D: 'bg-red-500/10 border-red-500/30',
};

/** Reads IndexedDB and returns today's completed activity record (if any). */
async function getTodayActivity(today: string): Promise<DailyActivityRecord | null> {
  if (typeof window === 'undefined') return null;
  try {
    const all = await getAllRecords<DailyActivityRecord>(STORES.DAILY_ACTIVITY);
    const todayRecord = all.find((r) => r.date === today && r.completed);
    return todayRecord ?? null;
  } catch {
    return null;
  }
}

/** Returns a persistent guestId from localStorage (created on first visit). */
function getGuestId(): string {
  const key = 'll_guest_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

/* ─────────────────────────────────────────────
   "Already Completed" screen
───────────────────────────────────────────── */
function AlreadyCompletedCard({ activity }: { activity: DailyActivityRecord }) {
  const timeUntil = formatDistanceToNow(startOfTomorrow(), { addSuffix: false });
  const mins = Math.floor(activity.timeInSeconds / 60);
  const secs = activity.timeInSeconds % 60;
  const timeLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {activity.puzzleType}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(), 'MMM d, yyyy')}
          </span>
        </div>
        <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Today&apos;s Puzzle Complete!
        </CardTitle>
        <CardDescription>Great job — come back tomorrow for a new challenge.</CardDescription>
      </CardHeader>

      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col items-center gap-6">

          {/* Rank badge */}
          <div className={`flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 ${RANK_BG[activity.rank] ?? 'bg-muted/20 border-muted'}`}>
            <span className={`text-5xl font-black leading-none ${RANK_COLOURS[activity.rank] ?? 'text-foreground'}`}>
              {activity.rank}
            </span>
            <span className="text-xs text-muted-foreground mt-1 font-medium">Rank</span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
            <div className="flex flex-col items-center p-3 rounded-xl bg-muted/30 border border-border">
              <Star className="h-5 w-5 text-primary mb-1" />
              <span className="text-xl font-bold">{activity.score.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">Score</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-muted/30 border border-border">
              <Clock className="h-5 w-5 text-primary mb-1" />
              <span className="text-xl font-bold">{timeLabel}</span>
              <span className="text-xs text-muted-foreground">Time</span>
            </div>
          </div>

          {/* Next puzzle countdown */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 px-5 py-3 rounded-full border border-border">
            <CalendarDays className="h-4 w-4" />
            <span>Next puzzle in <strong className="text-foreground">{timeUntil}</strong></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────────────────────
   Main PuzzleBoard
───────────────────────────────────────────── */
export function PuzzleBoard() {
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [todayActivity, setTodayActivity] = useState<DailyActivityRecord | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);

        // 1. Check if today's puzzle is already done — enforce one-per-day
        const existing = await getTodayActivity(today);
        if (existing) {
          setTodayActivity(existing);
          setLoading(false);
          return;
        }

        // 2. Not done yet — generate today's personalised puzzle
        const guestId = getGuestId();
        const dailyPuzzle = await generateDailyPuzzle({
          date: today,
          userProgressionLevel: 1,
          playerId: guestId, // server overrides with real userId if logged in
        });
        setPuzzle(dailyPuzzle);
      } catch (err) {
        setError("Failed to generate today's puzzle. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [today]);

  const renderPuzzle = () => {
    if (!puzzle) return null;
    switch (puzzle.puzzleType) {
      case 'NumberMatrix':
        if (puzzle.puzzleData.type === 'NumberMatrix') {
          return (
            <NumberMatrixPuzzle
              puzzleData={puzzle.puzzleData}
              autoStart={true}
              puzzleDate={today}
            />
          );
        }
        break;
      case 'PatternMatching':
        if (puzzle.puzzleData.type === 'PatternMatching') {
          return (
            <PatternMatchingPuzzle
              puzzleData={puzzle.puzzleData}
              autoStart={true}
            />
          );
        }
        break;
      case 'SequenceSolver':
        if (puzzle.puzzleData.type === 'SequenceSolver') {
          return (
            <SequenceSolverPuzzle
              puzzleData={puzzle.puzzleData}
              autoStart={true}
            />
          );
        }
        break;
      case 'DeductionGrid':
      case 'BinaryLogic':
        return (
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Coming Soon</AlertTitle>
            <AlertDescription>
              The puzzle type &quot;{puzzle.puzzleType}&quot; is under development. Check back for updates!
            </AlertDescription>
          </Alert>
        );
      default:
        return (
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Unknown Puzzle Type</AlertTitle>
            <AlertDescription>
              The puzzle type &quot;{puzzle.puzzleType}&quot; is not recognized.
            </AlertDescription>
          </Alert>
        );
    }
  };

  /* Loading skeleton */
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-5 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="aspect-square w-full max-w-xs mx-auto" />
        </CardContent>
      </Card>
    );
  }

  /* Error */
  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Oops!</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">{error}</p></CardContent>
      </Card>
    );
  }

  /* Already completed today */
  if (todayActivity) {
    return <AlreadyCompletedCard activity={todayActivity} />;
  }

  if (!puzzle) return null;

  /* Puzzle ready to play */
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {puzzle.puzzleType}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(), 'MMM d, yyyy')}
              </span>
            </div>
            <CardTitle className="text-xl font-bold font-headline">
              {puzzle.puzzleTitle}
            </CardTitle>
            <CardDescription className="mt-1">{puzzle.puzzleDescription}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!isGameStarted ? (
          <div className="flex flex-col items-center justify-center py-12 gap-6 bg-muted/20 rounded-xl border-2 border-dashed border-primary/20">
            <div className="relative animate-float">
              <div className="absolute -inset-2 rounded-full bg-primary/20 animate-pulse blur-md" />
              <Brain className="relative h-16 w-16 text-primary" />
            </div>
            <div className="text-center space-y-2 max-w-md px-4">
              <h3 className="text-xl font-semibold">Ready to Solve?</h3>
              <p className="text-muted-foreground text-sm">
                Click start to reveal today&apos;s puzzle. The timer begins immediately — you only get one attempt!
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setIsGameStarted(true)}
              className="gap-2 text-lg px-8 h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              <Play className="h-5 w-5" />
              Start Puzzle
            </Button>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in duration-300">
            {renderPuzzle()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
