'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { generateDailyPuzzle, generateNewPuzzle } from '@/lib/actions';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Brain, Play } from 'lucide-react';

export function PuzzleBoard() {
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    async function fetchPuzzle() {
      try {
        setLoading(true);
        const dailyPuzzle = await generateDailyPuzzle({
          date: today,
          userProgressionLevel: 1,
        });
        setPuzzle(dailyPuzzle);
      } catch (err) {
        setError("Failed to generate today's puzzle. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPuzzle();
  }, [today]);

  const handleNewPuzzle = async () => {
    setLoading(true);
    try {
      const newPuzzle = await generateNewPuzzle();
      setPuzzle(newPuzzle);
      setIsGameStarted(true);
    } catch (err) {
      setError('Failed to generate new puzzle.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderPuzzle = () => {
    if (!puzzle) return null;

    switch (puzzle.puzzleType) {
      case 'NumberMatrix':
        if (puzzle.puzzleData.type === 'NumberMatrix') {
          return (
            <NumberMatrixPuzzle
              puzzleData={puzzle.puzzleData}
              autoStart={true}
              onNewPuzzle={handleNewPuzzle}
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
              onNewPuzzle={handleNewPuzzle}
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
              onNewPuzzle={handleNewPuzzle}
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
              The puzzle type &quot;{puzzle.puzzleType}&quot; is under development.
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
              The puzzle type &quot;{puzzle.puzzleType}&quot; is not recognized.
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
          <Skeleton className="aspect-square w-full max-w-xs mx-auto" />
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
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!puzzle) return null;

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
                Click start to reveal today&apos;s puzzle. The timer begins immediately!
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
