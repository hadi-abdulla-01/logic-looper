'use client';

import { useState, useMemo, useCallback } from 'react';
import type { PatternMatchingData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PuzzleControls } from './puzzle-controls';
import { validatePatternMatching } from '@/lib/puzzle-validators';

interface PatternMatchingPuzzleProps {
    puzzleData: PatternMatchingData;
    autoStart?: boolean;

}

// Pattern visualization mapping
const PATTERN_VISUALS: Record<string, { emoji: string; color: string; label: string }> = {
    red_square: { emoji: '🟥', color: 'bg-red-500', label: 'Red Square' },
    blue_circle: { emoji: '🔵', color: 'bg-blue-500', label: 'Blue Circle' },
    green_triangle: { emoji: '🟩', color: 'bg-green-500', label: 'Green Triangle' },
    yellow_star: { emoji: '⭐', color: 'bg-yellow-500', label: 'Yellow Star' },
    orange_hexagon: { emoji: '🟧', color: 'bg-orange-500', label: 'Orange Hexagon' },
    purple_diamond: { emoji: '🟪', color: 'bg-purple-500', label: 'Purple Diamond' },
};

export function PatternMatchingPuzzle({ puzzleData, autoStart = false }: PatternMatchingPuzzleProps) {
    const { patternSequence, missingElementIndex, options } = puzzleData;
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [hasStarted, setHasStarted] = useState(autoStart);

    const displaySequence = useMemo(() => {
        const sequence = [...patternSequence];
        // Insert placeholder at missing index
        if (missingElementIndex >= 0 && missingElementIndex <= sequence.length) {
            sequence.splice(missingElementIndex, 0, 'MISSING');
        }
        return sequence;
    }, [patternSequence, missingElementIndex]);

    const onValidate = useCallback(() => {
        if (!selectedOption) return false;
        return validatePatternMatching(selectedOption, puzzleData);
    }, [selectedOption, puzzleData]);

    const onReset = useCallback(() => {
        setSelectedOption(null);
        setHasStarted(false);
    }, []);

    const getPatternVisual = (pattern: string) => {
        return PATTERN_VISUALS[pattern] || { emoji: pattern, color: 'bg-card', label: '' };
    };

    return (
        <div className="flex flex-col items-center gap-8">
            {/* Pattern Sequence Display */}
            <div className="w-full">
                <h3 className="text-lg font-semibold mb-4 text-center">Pattern Sequence</h3>
                <div className="flex flex-wrap justify-center gap-4">
                    {displaySequence.map((pattern, index) => {
                        const visual = getPatternVisual(pattern);
                        const isMissing = pattern === 'MISSING';

                        return (
                            <div
                                key={index}
                                className={cn(
                                    'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                                    isMissing
                                        ? 'border-dashed border-primary bg-primary/5 min-w-[100px]'
                                        : 'border-border bg-card'
                                )}
                            >
                                <div className="text-5xl">
                                    {isMissing ? (
                                        <div className="w-16 h-16 flex items-center justify-center">
                                            {selectedOption ? (
                                                <span>{getPatternVisual(selectedOption).emoji}</span>
                                            ) : (
                                                <span className="text-4xl text-muted-foreground">?</span>
                                            )}
                                        </div>
                                    ) : (
                                        visual.emoji
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">
                                    {isMissing ? (selectedOption ? getPatternVisual(selectedOption).label : 'Missing') : visual.label}
                                </span>
                                {!isMissing && (
                                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Options Grid */}
            <div className="w-full">
                <h3 className="text-lg font-semibold mb-4 text-center">Select the Missing Pattern</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-md mx-auto">
                    {options.map((option) => {
                        const visual = getPatternVisual(option);
                        const isSelected = selectedOption === option;

                        return (
                            <button
                                key={option}
                                onClick={() => {
                                    setSelectedOption(option);
                                    setHasStarted(true);
                                }}
                                className={cn(
                                    'flex flex-col items-center gap-2 p-6 rounded-lg border-2 transition-all hover:scale-105',
                                    isSelected
                                        ? 'border-primary bg-primary/10 shadow-lg'
                                        : 'border-border bg-card hover:border-primary/50'
                                )}
                            >
                                <div className="text-5xl">{visual.emoji}</div>
                                <span className="text-sm font-medium">{visual.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <PuzzleControls
                onValidate={onValidate}
                onReset={onReset}
                puzzleType={puzzleData.type}
                puzzleDescription={`Find the missing pattern in the sequence. Look for repeating patterns or logical progressions.`}
                userProgress={JSON.stringify({ selectedOption })}
                hasStarted={hasStarted}

            />
        </div>
    );
}
