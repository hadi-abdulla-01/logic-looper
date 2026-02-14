'use client';
import { useState, useMemo, useCallback } from 'react';
import type { NumberMatrixData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PuzzleControls } from './puzzle-controls';
import { validateNumberMatrix } from '@/lib/puzzle-validators';

interface NumberMatrixPuzzleProps {
  puzzleData: NumberMatrixData;
  autoStart?: boolean;
  onNewPuzzle?: () => void;
}

export function NumberMatrixPuzzle({ puzzleData, autoStart = false, onNewPuzzle }: NumberMatrixPuzzleProps) {
  const { gridSize, filledCells } = puzzleData;


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
      setHasStarted(true);
    }
  };

  const isPrefilled = (row: number, col: number) => {
    return filledCells.some((cell) => cell.row === row && cell.col === col);
  };

  const onValidate = useCallback(() => {
    const gridForValidation = userGrid.map(row => row.map(cell => (cell === '' ? null : Number(cell))));
    return validateNumberMatrix(gridForValidation, puzzleData);
  }, [userGrid, puzzleData]);

  const onReset = useCallback(() => {
    setUserGrid(initialGrid);
    setHasStarted(false);
  }, [initialGrid]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="grid bg-card border rounded-lg shadow-inner"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
      >
        {userGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isSubgridBorderRight = (colIndex + 1) % Math.sqrt(gridSize) === 0 && colIndex < gridSize - 1;
            const isSubgridBorderBottom = (rowIndex + 1) % Math.sqrt(gridSize) === 0 && rowIndex < gridSize - 1;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                  'aspect-square flex items-center justify-center border-border',
                  'border-r border-b',
                  colIndex === gridSize - 1 && 'border-r-0',
                  rowIndex === gridSize - 1 && 'border-b-0',
                  isSubgridBorderRight && 'border-r-2 border-r-muted-foreground/50',
                  isSubgridBorderBottom && 'border-b-2 border-b-muted-foreground/50'
                )}
              >
                {isPrefilled(rowIndex, colIndex) ? (
                  <span className="text-2xl font-bold text-foreground">
                    {cell}
                  </span>
                ) : (
                  <input
                    type="text"
                    maxLength={1}
                    value={cell === null ? '' : cell}
                    onChange={(e) => handleInputChange(e, rowIndex, colIndex)}
                    className="w-full h-full bg-transparent text-primary text-2xl font-semibold text-center outline-none focus:bg-primary/10 transition-colors duration-200"
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
        onNewPuzzle={onNewPuzzle}
      // No specific prop was provided in the instruction, so no new prop is added.
      // If a prop was intended, please specify its name and value.
      />
    </div>
  );
}
