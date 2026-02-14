'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { generateDailyPuzzle } from '@/lib/actions';
import type { DailyPuzzle } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NumberMatrixPuzzle } from '@/components/number-matrix-puzzle';
import { PatternMatchingPuzzle } from '@/components/pattern-matching-puzzle';
import { SequenceSolverPuzzle } from '@/components/sequence-solver-puzzle';
import { PuzzleControls } from '@/components/puzzle-controls';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

function PuzzleSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-5/6" />
      <div className="pt-4">
        <Skeleton className="aspect-square w-full" />
      </div>
      <div className="flex justify-between pt-4">
        <Skeleton className="h-10 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Brain, Play } from 'lucide-react';

export function PuzzleBoard() {
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);

  useEffect(() => {
    async function fetchPuzzle() {
      try {
        setLoading(true);
        const today = format(new Date(), 'yyyy-MM-dd');
        const dailyPuzzle = await generateDailyPuzzle({
          date: today,
          userProgressionLevel: 1, // Placeholder
        });
        setPuzzle(dailyPuzzle);
      } catch (err) {
        setError('Failed to generate today\'s puzzle. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPuzzle();
  }, []);

  const renderPuzzle = () => {
    if (!puzzle) return null;

    switch (puzzle.puzzleType) {
      case 'NumberMatrix':
        if (puzzle.puzzleData.type === 'NumberMatrix') {
          return <NumberMatrixPuzzle puzzleData={puzzle.puzzleData} autoStart={true} />;
        }
        break;
      case 'PatternMatching':
        if (puzzle.puzzleData.type === 'PatternMatching') {
          return <PatternMatchingPuzzle puzzleData={puzzle.puzzleData} autoStart={true} />;
        }
        break;
      case 'SequenceSolver':
        if (puzzle.puzzleData.type === 'SequenceSolver') {
          return <SequenceSolverPuzzle puzzleData={puzzle.puzzleData} autoStart={true} />;
        }
        break;
      case 'DeductionGrid':
      case 'BinaryLogic':
        return (
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Coming Soon</AlertTitle>
            <AlertDescription>
              The puzzle type "{puzzle.puzzleType}" is under development.
              Check back for updates!
            </AlertDescription>
          </Alert>
        );
      default:
        return (
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Unknown Puzzle Type</AlertTitle>
            <AlertDescription>
              The puzzle type "{puzzle.puzzleType}" is not recognized.
            </AlertDescription>
          </Alert>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-5 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="aspect-square w-full" />
        </CardContent>
        <CardFooter>
          <div className="flex w-full justify-between pt-4">
            <Skeleton className="h-10 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Oops!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!puzzle) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline">
          {puzzle.puzzleTitle}
        </CardTitle>
        <CardDescription>{puzzle.puzzleDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {!isGameStarted ? (
          <div className="flex flex-col items-center justify-center py-12 gap-6 bg-muted/20 rounded-lg border-2 border-dashed">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-primary/20 animate-pulse blur-sm" />
              <Brain className="relative h-16 w-16 text-primary" />
            </div>
            <div className="text-center space-y-2 max-w-md px-4">
              <h3 className="text-xl font-semibold">Ready to Solve?</h3>
              <p className="text-muted-foreground">
                Click start to reveal today's puzzle. The timer will begin immediately!
              </p>
            </div>
            <Button size="lg" onClick={() => setIsGameStarted(true)} className="gap-2 text-lg px-8 h-12 shadow-lg shadow-primary/20">
              <Play className="h-5 w-5" /> Start Puzzle
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
