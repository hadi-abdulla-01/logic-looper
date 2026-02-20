'use client'

import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, RefreshCw, CheckCircle2, Trophy, Clock, Loader2, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { getContextualPuzzleHint, savePuzzleCompletion } from "@/lib/actions";
import { usePuzzleTimer } from "@/hooks/use-puzzle-timer";
import { calculateScore, getDifficultyLevel, type PuzzleType } from "@/lib/scoring";
import { getUserProgress, updateUserProgress, completePuzzle, getCompletedDates } from "@/lib/indexeddb";
import { calculateStreak, getTodayDate } from "@/lib/date-utils";
import { CompletionAnimation } from "@/components/completion-animation";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils";

type PuzzleControlsProps = {
  onValidate: () => boolean;
  onReset: () => void;
  puzzleType: string;
  puzzleDescription: string;
  userProgress: string;
  gridSize?: number;
  hasStarted?: boolean;

};

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline';

export function PuzzleControls({
  onValidate,
  onReset,
  puzzleType,
  puzzleDescription,
  userProgress,
  gridSize,
  hasStarted = false,

}: PuzzleControlsProps) {
  const { toast } = useToast();
  const timer = usePuzzleTimer();
  const { isOnline } = useOnlineStatus();
  const [streak, setStreak] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completionScore, setCompletionScore] = useState<{ score: number; rank: 'S' | 'A' | 'B' | 'C' | 'D' } | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const today = getTodayDate();

  const [hint, setHint] = useState<{ hint: string, category: string } | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);

  // Load streak from IndexedDB on mount
  useEffect(() => {
    async function loadStreak() {
      try {
        const completedDates = await getCompletedDates();
        const currentStreak = calculateStreak(completedDates);
        setStreak(currentStreak);
      } catch (error) {
        console.error('Failed to load streak:', error);
      }
    }
    loadStreak();
  }, []);

  // Start timer on first interaction
  useEffect(() => {
    if (hasStarted && !timer.isRunning && !isCompleted) {
      timer.start();
    }
  }, [hasStarted, timer, isCompleted]);

  const handleValidate = async () => {
    const isCorrect = onValidate();

    if (isCorrect) {
      // Stop timer
      timer.stop();
      setIsCompleted(true);

      // Calculate score
      const difficulty = getDifficultyLevel(puzzleType as PuzzleType, gridSize);
      const scoreResult = calculateScore({
        puzzleType: puzzleType as PuzzleType,
        difficulty,
        timeInSeconds: timer.time,
        hintsUsed,
        isPerfect: hintsUsed === 0,
      });

      setCompletionScore({ score: scoreResult.totalScore, rank: scoreResult.rank });

      let saveSuccess = false;
      try {
        // Save to IndexedDB first (offline-first)
        await completePuzzle(
          today,
          scoreResult.totalScore,
          timer.time,
          puzzleType,
          difficulty,
          scoreResult.rank
        );
        saveSuccess = true;
        // Notify heatmap to refresh
        window.dispatchEvent(new CustomEvent('puzzle-completed'));
      } catch (error) {
        console.error('Failed to save puzzle to IndexedDB:', error);
      }

      let displayStreak = streak;
      let updatedTotalPuzzlesSolved = 0;
      let updatedTotalScore = 0;

      if (saveSuccess) {
        try {
          // Update streak
          const completedDates = await getCompletedDates();
          const newStreak = calculateStreak(completedDates);
          setStreak(newStreak);
          displayStreak = newStreak;

          // Update user progress in IndexedDB
          const userProgressResult = await getUserProgress();
          updatedTotalPuzzlesSolved = userProgressResult.totalPuzzlesSolved + 1;
          updatedTotalScore = userProgressResult.totalScore + scoreResult.totalScore;

          await updateUserProgress({
            streak: newStreak,
            lastPlayedDate: today,
            totalPuzzlesSolved: updatedTotalPuzzlesSolved,
            totalScore: updatedTotalScore,
            averageTime: Math.round(
              (userProgressResult.averageTime * userProgressResult.totalPuzzlesSolved + timer.time) /
              (userProgressResult.totalPuzzlesSolved + 1)
            ),
          });
        } catch (statsError) {
          console.error('Failed to update stats:', statsError);
        }
      }

      // Show confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);

      // Show success toast with score breakdown
      toast({
        title: "🎉 Puzzle Solved!",
        description: (
          <div className="space-y-3 animate-score-reveal">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-white/70">Score</span>
                <span className="font-bold text-lg">{scoreResult.totalScore.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/70">Rank</span>
                <span className={cn(
                  "font-bold text-lg",
                  scoreResult.rank === 'S' && 'text-yellow-300',
                  scoreResult.rank === 'A' && 'text-green-300',
                  scoreResult.rank === 'B' && 'text-blue-300',
                )}>
                  {scoreResult.rank}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/70">Time</span>
                <span className="font-semibold">{timer.formatTime()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/70">Streak</span>
                <span className="font-bold text-amber-300">{displayStreak} 🔥</span>
              </div>
            </div>
          </div>
        ),
        variant: 'default',
        className: 'bg-gradient-to-br from-primary to-accent text-white border-0',
        duration: 6000,
      });

      // Sync to server (best-effort, after local save)
      if (isOnline) {
        setSyncStatus('syncing');
        try {
          await savePuzzleCompletion({
            date: today,
            puzzleType,
            difficulty,
            score: scoreResult.totalScore,
            timeInSeconds: timer.time,
            rank: scoreResult.rank,
            hintsUsed,
            userStats: {
              streak: displayStreak,
              totalPuzzlesSolved: updatedTotalPuzzlesSolved,
              totalScore: updatedTotalScore,
            }
          });
          setSyncStatus('synced');
          setTimeout(() => setSyncStatus('idle'), 3000);
        } catch (syncErr) {
          console.warn('Server sync failed (will retry when online):', syncErr);
          setSyncStatus('offline');
          setTimeout(() => setSyncStatus('idle'), 4000);
        }
      } else {
        setSyncStatus('offline');
        setTimeout(() => setSyncStatus('idle'), 4000);
      }

    } else {
      toast({
        title: "Not Quite...",
        description: "The solution is not correct yet. Keep trying!",
        variant: "destructive",
      });
    }
  };

  const handleGetHint = async () => {
    setIsHintLoading(true);
    setHint(null);
    try {
      const hintData = await getContextualPuzzleHint({
        puzzleType: puzzleType,
        currentState: userProgress,
        hintsUsed: hintsUsed
      });
      setHint({ hint: hintData.hint, category: hintData.hintCategory });
      setHintsUsed(prev => prev + 1);
    } catch (error) {
      console.error("Failed to get hint:", error);
      toast({
        title: "Error",
        description: "Could not fetch a hint at this time.",
        variant: "destructive",
      });
    } finally {
      setIsHintLoading(false);
    }
  };

  const handleReset = () => {
    onReset();
    timer.reset();
    setHintsUsed(0);
    setIsCompleted(false);
    setCompletionScore(null);
    setSyncStatus('idle');
  };

  const getStreakColor = (s: number) => {
    if (s >= 30) return 'text-red-500';
    if (s >= 14) return 'text-orange-500';
    if (s >= 7) return 'text-amber-500';
    return 'text-amber-400';
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Confetti on completion */}
      {showConfetti && completionScore && (
        <CompletionAnimation score={completionScore.score} rank={completionScore.rank} />
      )}

      {/* Completion banner */}
      {isCompleted && completionScore && (
        <div className="animate-slide-up flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-primary">Puzzle Complete!</p>
              <p className="text-xs text-muted-foreground">
                Score: <strong>{completionScore.score.toLocaleString()}</strong> · Rank: <strong className="text-primary">{completionScore.rank}</strong>
              </p>
            </div>
          </div>
          {/* Sync status badge */}
          <div className="flex items-center gap-1.5 text-xs">
            {syncStatus === 'syncing' && (
              <span className="flex items-center gap-1 text-blue-500 animate-sync">
                <Loader2 className="h-3 w-3 animate-spin" />
                Syncing...
              </span>
            )}
            {syncStatus === 'synced' && (
              <span className="flex items-center gap-1 text-green-500">
                <CheckCheck className="h-3 w-3" />
                Synced
              </span>
            )}
            {syncStatus === 'offline' && (
              <span className="flex items-center gap-1 text-amber-500">
                <Clock className="h-3 w-3" />
                Saved offline
              </span>
            )}
          </div>
        </div>
      )}

      {/* Timer and Stats Bar */}
      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-xl border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-lg font-semibold tabular-nums">
              {timer.formatTime()}
            </span>
          </div>

          {/* Streak indicator with fire animation */}
          <div className={cn(
            "flex items-center gap-1.5 font-semibold",
            getStreakColor(streak)
          )}>
            <span className={cn(
              "text-base select-none",
              streak >= 3 && "animate-fire"
            )}>🔥</span>
            <span className="tabular-nums">
              {streak}
              <span className="font-normal text-xs text-muted-foreground ml-1">day streak</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Lightbulb className="h-4 w-4" />
          <span>
            Hints: <span className={cn(
              "font-semibold",
              hintsUsed > 0 && "text-amber-500"
            )}>{hintsUsed}</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center gap-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isCompleted} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>

        </div>

        <div className="flex gap-2">
          {/* Hint button with dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={handleGetHint}
                disabled={isHintLoading || isCompleted}
                className={cn(
                  "gap-2 transition-all",
                  hintsUsed > 0 && "border-amber-300 text-amber-600"
                )}
              >
                <Lightbulb className={cn(
                  "h-4 w-4",
                  isHintLoading && "animate-pulse"
                )} />
                {isHintLoading ? 'Thinking...' : 'Hint'}
                {hintsUsed > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5">
                    {hintsUsed}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Hint #{hintsUsed}
                </DialogTitle>
                <DialogDescription asChild>
                  <div>
                    {hint ? (
                      <div className="mt-2 space-y-2">
                        <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {hint.category}
                        </span>
                        <p className="text-foreground text-sm leading-relaxed">{hint.hint}</p>
                        <p className="text-xs text-muted-foreground pt-1">
                          Note: Each hint reduces your score by a small penalty.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span>Getting a hint for you...</span>
                      </div>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          {/* Validate button */}
          <Button
            onClick={handleValidate}
            disabled={isCompleted}
            className={cn(
              "gap-2 transition-all",
              isCompleted
                ? "bg-green-500 hover:bg-green-500 cursor-default"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isCompleted ? (
              <>
                <Trophy className="h-4 w-4" />
                <span>Completed!</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Validate</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
