import { DailyPuzzle, NumberMatrixData, PatternMatchingData, SequenceSolverData } from '@/lib/types';

// Static puzzle generator - no AI needed
export function generateDailyPuzzle(date: string): DailyPuzzle {
    // Use date as seed for consistent daily puzzles
    const seed = date.split('-').reduce((acc, val) => acc + parseInt(val), 0);
    const puzzleTypes = ['NumberMatrix', 'PatternMatching', 'SequenceSolver'] as const;
    const puzzleType = puzzleTypes[seed % puzzleTypes.length]; // Deterministic type selection based on date

    if (puzzleType === 'NumberMatrix') {
        return generateNumberMatrixPuzzle(seed);
    } else if (puzzleType === 'PatternMatching') {
        return generatePatternMatchingPuzzle(seed);
    } else {
        return generateSequenceSolverPuzzle(seed);
    }
}

function generateNumberMatrixPuzzle(seed: number): DailyPuzzle {
    // Simple 4x4 Sudoku-like puzzle
    const solution = [
        [1, 2, 3, 4],
        [3, 4, 1, 2],
        [2, 3, 4, 1],
        [4, 1, 2, 3],
    ];

    // Remove some cells based on seed (simple logic)
    const filledCells: { row: number; col: number; value: number }[] = [];
    solution.forEach((row, r) => {
        row.forEach((value, c) => {
            // Keep ~50% of cells
            if ((r + c + seed) % 2 === 0) {
                filledCells.push({ row: r, col: c, value });
            }
        });
    });

    const puzzleData: NumberMatrixData = {
        type: 'NumberMatrix',
        gridSize: 4,
        filledCells: filledCells,
        rules: ["Each row and column must contain unique numbers from 1 to 4."],
    };

    return {
        puzzleType: 'NumberMatrix',
        puzzleTitle: 'Daily Number Matrix',
        puzzleDescription: 'Fill the grid so that every row and column contains digits 1-4 exactly once.',
        puzzleData: puzzleData,
        solutionHint: 'Start with rows or columns that are almost full.',
    };
}

function generatePatternMatchingPuzzle(seed: number): DailyPuzzle {
    const patterns = [
        ['🔴', '🔵', '🟢', '🟡'],
        ['⭐', '❤️', '🌙', '☀️'],
        ['🍎', '🍊', '🍋', '🍇'],
    ];

    const basePattern = patterns[seed % patterns.length];
    // Simple pattern: ABAB or AABB etc. Let's do a repeating sequence.
    // We need to match the PatternMatchingData type.
    // patternSequence: string[]; missingElementIndex: number; options: string[];

    const patternSequence = [...basePattern, ...basePattern]; // 8 items
    const missingIndex = (seed % 4) + 4; // remove one from the second half
    const correctAnswer = patternSequence[missingIndex];
    patternSequence[missingIndex] = '?';

    const puzzleData: PatternMatchingData = {
        type: 'PatternMatching',
        patternSequence: patternSequence,
        missingElementIndex: missingIndex,
        options: basePattern, // The options are the set of emojis
    };

    return {
        puzzleType: 'PatternMatching',
        puzzleTitle: 'Daily Pattern Match',
        puzzleDescription: 'Identify the missing element in the pattern sequence.',
        puzzleData: puzzleData,
        solutionHint: `The pattern repeats every ${basePattern.length} items.`,
    };
}

function generateSequenceSolverPuzzle(seed: number): DailyPuzzle {
    // Arithmetic sequence
    const start = (seed % 10) + 1;
    const diff = (seed % 5) + 1;
    // Sequence: a, a+d, a+2d, a+3d, missing
    const sequence = [start, start + diff, start + diff * 2, start + diff * 3];

    // SequenceSolverData: sequence: number[]; nextNItems: number; description: string;
    const puzzleData: SequenceSolverData = {
        type: 'SequenceSolver',
        sequence: sequence,
        nextNItems: 1,
        description: `What comes next in this arithmetic sequence? (Step: +${diff})`
    };

    return {
        puzzleType: 'SequenceSolver',
        puzzleTitle: 'Daily Sequence Solver',
        puzzleDescription: 'Find the next number in the sequence.',
        puzzleData: puzzleData,
        solutionHint: `The numbers follow an arithmetic progression with a constant difference.`,
    };
}
