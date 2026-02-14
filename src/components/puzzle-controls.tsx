'use client'

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, RefreshCw, CheckCircle2, Award, Clock, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { getContextualPuzzleHint, updateUserStats } from "@/lib/actions";
import { usePuzzleTimer } from "@/hooks/use-puzzle-timer";
import { calculateScore, getDifficultyLevel, type PuzzleType } from "@/lib/scoring";
import { getUserProgress, updateUserProgress, completePuzzle, getCompletedDates } from "@/lib/indexeddb";
import { calculateStreak, getTodayDate } from "@/lib/date-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


type PuzzleControlsProps = {
  onValidate: () => boolean;
  onReset: () => void;
  puzzleType: string;
  puzzleDescription: string;
  userProgress: string;
  gridSize?: number; // For difficulty calculation
  hasStarted?: boolean;
};

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
  const [streak, setStreak] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
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

      let saveSuccess = false;
      try {
        // Save to IndexedDB
        await completePuzzle(
          today,
          scoreResult.totalScore,
          timer.time,
          puzzleType,
          difficulty,
          scoreResult.rank
        );
        saveSuccess = true;
      } catch (error) {
        console.error('Failed to save puzzle to IndexedDB:', error);
      }

      if (saveSuccess) {
        let displayStreak = streak;

        try {
          // Update streak
          const completedDates = await getCompletedDates();
          const newStreak = calculateStreak(completedDates);
          setStreak(newStreak);
          displayStreak = newStreak;

          // Update user progress
          const userProgressResult = await getUserProgress();
          const updatedTotalPuzzlesSolved = userProgressResult.totalPuzzlesSolved + 1;
          const updatedTotalScore = userProgressResult.totalScore + scoreResult.totalScore;

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

          // Sync to server
          await updateUserStats({
            streak: newStreak,
            totalPuzzlesSolved: updatedTotalPuzzlesSolved,
            totalScore: updatedTotalScore
          });

        } catch (statsError) {
          console.error('Failed to update stats:', statsError);
        }

        // Show success toast with score
        toast({
          title: "🎉 Congratulations!",
          description: (
            <div className="space-y-2">
              <p className="font-semibold">Puzzle solved correctly!</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Score: <span className="font-bold">{scoreResult.totalScore}</span></div>
                <div>Rank: <span className="font-bold text-primary">{scoreResult.rank}</span></div>
                <div>Time: <span className="font-bold">{timer.formatTime()}</span></div>
                <div>Streak: <span className="font-bold text-amber-500">{displayStreak} 🔥</span></div>
              </div>
            </div>
          ),
          variant: 'default',
          className: 'bg-green-500 text-white',
          duration: 6000,
        });
      } else {
        toast({
          title: "Puzzle Solved!",
          description: "Great job! (Note: Progress could not be saved to local storage)",
          variant: 'default',
          className: 'bg-green-500 text-white',
        });
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
        currentState: userProgress, // Map userProgress to currentState
        hintsUsed: hintsUsed // Map hintsUsed
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
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Timer and Stats Bar */}
      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5" />
            <span className="font-mono text-lg font-semibold">{timer.formatTime()}</span>
          </div>
          <div className="flex items-center gap-2 text-amber-500 font-semibold">
            <Award className="h-5 w-5" />
            <span>Streak: {streak} days</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Lightbulb className="h-4 w-4" />
          <span>Hints used: {hintsUsed}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleReset} disabled={isCompleted}>
          <RefreshCw className="mr-2 h-4 w-4" /> Reset
        </Button>

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleGetHint} disabled={isHintLoading || isCompleted}>
                <Lightbulb className="mr-2 h-4 w-4" /> {isHintLoading ? 'Thinking...' : 'Hint'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Here's a little hint...</DialogTitle>
                <DialogDescription>
                  {hint ? (
                    <>
                      <p className="font-semibold text-primary py-2">{hint.category}</p>
                      <p>{hint.hint}</p>
                    </>
                  ) : 'Getting a hint for you...'}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <Button onClick={handleValidate} disabled={isCompleted}>
            {isCompleted ? (
              <>
                <Trophy className="mr-2 h-4 w-4" /> Completed
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Validate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
