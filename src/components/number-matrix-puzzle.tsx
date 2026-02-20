'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import type { NumberMatrixData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PuzzleControls } from './puzzle-controls';
import { validateNumberMatrix } from '@/lib/puzzle-validators';
import { getPuzzleForDate, savePuzzleProgress } from '@/lib/indexeddb';
import { getTodayDate } from '@/lib/date-utils';

interface NumberMatrixPuzzleProps {
  puzzleData: NumberMatrixData;
  autoStart?: boolean;

  puzzleDate?: string;
}

export function NumberMatrixPuzzle({ puzzleData, autoStart = false, puzzleDate }: NumberMatrixPuzzleProps) {
  const { gridSize, filledCells } = puzzleData;
  const date = puzzleDate || getTodayDate();

  const initialGrid = useMemo(() => {
    const grid: (number | null)[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null));

    filledCells.forEach(({ row, col, value }) => {
      grid[row][col] = value;
    });

    return grid;
  }, [gridSize, filledCells]);

  const [userGrid, setUserGrid] = useState<(number | string | null)[][]>(initialGrid);
  const [hasStarted, setHasStarted] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);

  // Auto-restore progress from IndexedDB on mount
  useEffect(() => {
    async function restoreProgress() {
      try {
        const savedPuzzle = await getPuzzleForDate(date);
        if (savedPuzzle?.userSolution && !savedPuzzle.completed) {
          const restored = JSON.parse(JSON.stringify(savedPuzzle.userSolution));
          setUserGrid(restored);
          setHasStarted(true);
        }
        if (savedPuzzle?.completed) {
          setIsCompleted(true);
        }
      } catch (error) {
        // silently ignore — fresh start
      }
    }
    restoreProgress();
  }, [date]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    row: number,
    col: number
  ) => {
    const value = e.target.value;
    const newGrid = userGrid.map((r) => [...r]);

    // Allow only single digits from 1 to gridSize
    if (value === '' || (/^[1-9]$/.test(value) && parseInt(value, 10) <= gridSize)) {
      newGrid[row][col] = value === '' ? '' : parseInt(value, 10);
      setUserGrid(newGrid);

      if (!hasStarted) setHasStarted(true);

      // Auto-save to IndexedDB debounced
      autoSaveProgress(newGrid);
    }
  };

  const autoSaveProgress = useCallback(async (grid: (number | string | null)[][]) => {
    try {
      await savePuzzleProgress({
        id: date,
        puzzleType: puzzleData.type,
        puzzleData,
        userSolution: grid,
        completed: false,
        hintsUsed: 0,
        synced: false,
      });
    } catch {
      // silently fail — non-critical
    }
  }, [date, puzzleData]);

  const isPrefilled = (row: number, col: number) => {
    return filledCells.some((cell) => cell.row === row && cell.col === col);
  };

  const isHighlighted = (rowIndex: number, colIndex: number) => {
    if (!focusedCell) return false;
    return focusedCell.row === rowIndex || focusedCell.col === colIndex;
  };

  const onValidate = useCallback(() => {
    const gridForValidation = userGrid.map(row => row.map(cell => (cell === '' ? null : Number(cell))));
    const result = validateNumberMatrix(gridForValidation, puzzleData);
    if (result) setIsCompleted(true);
    return result;
  }, [userGrid, puzzleData]);

  const onReset = useCallback(() => {
    setUserGrid(initialGrid);
    setHasStarted(false);
    setIsCompleted(false);
    setFocusedCell(null);
    // Clear saved progress
    savePuzzleProgress({
      id: date,
      puzzleType: puzzleData.type,
      puzzleData,
      userSolution: null,
      completed: false,
      hintsUsed: 0,
      synced: false,
    }).catch(console.error);
  }, [initialGrid, date, puzzleData]);

  const subgridSize = Math.sqrt(gridSize);
  const hasSubgrids = Number.isInteger(subgridSize);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Size indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
          {gridSize}×{gridSize}
        </span>
        {hasStarted && !isCompleted && (
          <span className="text-xs text-primary animate-pulse">Auto-saving...</span>
        )}
        {isCompleted && (
          <span className="text-xs text-green-600 font-semibold">✓ Completed</span>
        )}
      </div>

      {/* Grid */}
      <div
        className={cn(
          "grid bg-card border-2 rounded-xl shadow-md overflow-hidden",
          isCompleted && "border-green-400 ring-2 ring-green-300/50"
        )}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
      >
        {userGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const prefilled = isPrefilled(rowIndex, colIndex);
            const highlighted = isHighlighted(rowIndex, colIndex);
            const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === colIndex;
            const isSubgridBorderRight = hasSubgrids && (colIndex + 1) % subgridSize === 0 && colIndex < gridSize - 1;
            const isSubgridBorderBottom = hasSubgrids && (rowIndex + 1) % subgridSize === 0 && rowIndex < gridSize - 1;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                  'aspect-square flex items-center justify-center border-border transition-colors duration-150',
                  'border-r border-b',
                  colIndex === gridSize - 1 && 'border-r-0',
                  rowIndex === gridSize - 1 && 'border-b-0',
                  isSubgridBorderRight && 'border-r-2 border-r-foreground/30',
                  isSubgridBorderBottom && 'border-b-2 border-b-foreground/30',
                  // Highlighting
                  highlighted && !prefilled && !isFocused && 'bg-primary/5',
                  isFocused && 'bg-primary/15',
                  prefilled && 'bg-muted/40',
                )}
              >
                {prefilled ? (
                  <span className={cn(
                    "text-lg sm:text-2xl font-bold text-foreground select-none",
                    isCompleted && "text-green-700 dark:text-green-400"
                  )}>
                    {cell}
                  </span>
                ) : (
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={cell === null ? '' : String(cell)}
                    onChange={(e) => handleInputChange(e, rowIndex, colIndex)}
                    onFocus={() => setFocusedCell({ row: rowIndex, col: colIndex })}
                    onBlur={() => setFocusedCell(null)}
                    disabled={isCompleted}
                    className={cn(
                      "w-full h-full bg-transparent text-lg sm:text-2xl font-semibold text-center",
                      "outline-none transition-colors duration-200",
                      "disabled:cursor-default",
                      cell ? "text-primary" : "text-muted-foreground",
                      isCompleted && "text-green-600"
                    )}
                    aria-label={`Cell at row ${rowIndex + 1}, column ${colIndex + 1}`}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <PuzzleControls
        onValidate={onValidate}
        onReset={onReset}
        puzzleType={puzzleData.type}
        puzzleDescription={puzzleData.rules.join(' ')}
        userProgress={JSON.stringify(userGrid)}
        gridSize={gridSize}
        hasStarted={hasStarted}

      />
    </div>
  );
}
