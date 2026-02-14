'use client';

import { useState, useCallback } from 'react';
import type { SequenceSolverData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PuzzleControls } from './puzzle-controls';
import { validateSequenceSolver } from '@/lib/puzzle-validators';
import { Input } from './ui/input';

interface SequenceSolverPuzzleProps {
    puzzleData: SequenceSolverData;
    autoStart?: boolean;
}

export function SequenceSolverPuzzle({ puzzleData, autoStart = false }: SequenceSolverPuzzleProps) {
    const { sequence, nextNItems, description } = puzzleData;
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(nextNItems).fill(''));
    const [hasStarted, setHasStarted] = useState(autoStart);

    const handleInputChange = (index: number, value: string) => {
        // Allow only numbers (positive, negative, decimals)
        if (value === '' || value === '-' || /^-?\d*\.?\d*$/.test(value)) {
            const newAnswers = [...userAnswers];
            newAnswers[index] = value;
            setUserAnswers(newAnswers);
            setHasStarted(true);
        }
    };

    const onValidate = useCallback(() => {
        // Convert string answers to numbers
        const numericAnswers = userAnswers.map((ans) => {
            const num = parseFloat(ans);
            return isNaN(num) ? null : num;
        });

        // Check if all answers are filled
        if (numericAnswers.some((ans) => ans === null)) {
            return false;
        }

        return validateSequenceSolver(numericAnswers as number[], puzzleData);
    }, [userAnswers, puzzleData]);

    const onReset = useCallback(() => {
        setUserAnswers(Array(nextNItems).fill(''));
        setHasStarted(false);
    }, [nextNItems]);

    return (
        <div className="flex flex-col items-center gap-8">
            {/* Description */}
            <div className="w-full max-w-2xl">
                <p className="text-center text-muted-foreground mb-6">{description}</p>
            </div>

            {/* Sequence Display */}
            <div className="w-full">
                <h3 className="text-lg font-semibold mb-4 text-center">Given Sequence</h3>
                <div className="flex flex-wrap justify-center gap-3">
                    {sequence.map((num, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="w-20 h-20 flex items-center justify-center bg-card border-2 border-border rounded-lg">
                                <span className="text-2xl font-bold text-foreground">{num}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">n={index + 1}</span>
                        </div>
                    ))}

                    {/* Separator */}
                    <div className="flex items-center justify-center w-12 h-20">
                        <span className="text-3xl text-muted-foreground">→</span>
                    </div>

                    {/* User Input Boxes */}
                    {userAnswers.map((answer, index) => (
                        <div
                            key={`answer-${index}`}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className={cn(
                                "w-20 h-20 flex items-center justify-center border-2 rounded-lg transition-all",
                                answer ? "border-primary bg-primary/5" : "border-dashed border-muted-foreground bg-muted/20"
                            )}>
                                <Input
                                    type="text"
                                    value={answer}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    className="w-full h-full text-center text-2xl font-bold border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                    placeholder="?"
                                    maxLength={6}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground">n={sequence.length + index + 1}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hint Section */}
            <div className="w-full max-w-2xl bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-center text-muted-foreground">
                    <strong>Tip:</strong> Look for arithmetic patterns (addition/subtraction), geometric patterns (multiplication/division),
                    or special sequences (Fibonacci, squares, primes, etc.)
                </p>
            </div>

            <PuzzleControls
                onValidate={onValidate}
                onReset={onReset}
                puzzleType={puzzleData.type}
                puzzleDescription={description}
                userProgress={JSON.stringify({ userAnswers })}
                hasStarted={hasStarted}
            />
        </div>
    );
}
