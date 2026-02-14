import type { NumberMatrixData, PatternMatchingData, SequenceSolverData } from './types';

export function validateNumberMatrix(
  board: (number | null)[][],
  puzzle: NumberMatrixData
): boolean {
  const size = puzzle.gridSize;

  // Check for completeness first
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === null) {
        return false; // Incomplete board
      }
    }
  }

  // Check rows and columns for duplicates and valid numbers
  for (let i = 0; i < size; i++) {
    const row = new Set<number>();
    const col = new Set<number>();
    for (let j = 0; j < size; j++) {
      const rowVal = board[i][j]!;
      const colVal = board[j][i]!;
      if (rowVal < 1 || rowVal > size || colVal < 1 || colVal > size) return false; // Invalid number
      row.add(rowVal);
      col.add(colVal);
    }
    if (row.size !== size || col.size !== size) return false; // Duplicates
  }

  // Check subgrids (assuming sqrt(size) is an integer)
  const subgridSize = Math.sqrt(size);
  if (Number.isInteger(subgridSize)) {
    for (let boxRow = 0; boxRow < size; boxRow += subgridSize) {
      for (let boxCol = 0; boxCol < size; boxCol += subgridSize) {
        const subgrid = new Set<number>();
        for (let i = boxRow; i < boxRow + subgridSize; i++) {
          for (let j = boxCol; j < boxCol + subgridSize; j++) {
            const val = board[i][j]!;
            subgrid.add(val);
          }
        }
        if (subgrid.size !== size) return false; // Duplicates in subgrid
      }
    }
  }

  return true;
}

/**
 * Validate PatternMatching puzzle solution
 */
export function validatePatternMatching(
  selectedOption: string,
  puzzle: PatternMatchingData
): boolean {
  const { patternSequence, missingElementIndex } = puzzle;

  // Logic robust to '?' placeholder in sequence
  // We check if the sequence (excluding the hole) repeats
  if (patternSequence.length >= 2) {
    for (let patternLen = 1; patternLen <= patternSequence.length / 2; patternLen++) {
      let isRepeating = true;

      for (let i = 0; i < patternSequence.length; i++) {
        // Skip validation at the missing index
        if (i === missingElementIndex) continue;

        const targetIndex = i % patternLen;

        // If the comparison target is the hole (in the first cycle), we can't verify, so skip
        // This handles correctly if missingElementIndex < patternLen
        if (targetIndex === (missingElementIndex % patternLen)) continue;

        if (patternSequence[i] !== patternSequence[targetIndex]) {
          isRepeating = false;
          break;
        }
      }

      if (isRepeating) {
        // Found pattern! Determine the symbol that should be at the hole
        const slot = missingElementIndex % patternLen;
        let expectedSymbol: string | undefined;

        // Find a valid symbol in the sequence corresponding to this slot
        for (let k = slot; k < patternSequence.length; k += patternLen) {
          if (k !== missingElementIndex) {
            expectedSymbol = patternSequence[k];
            break;
          }
        }

        if (expectedSymbol) {
          return selectedOption === expectedSymbol;
        }
      }
    }
  }

  return false;
}

/**
 * Validate SequenceSolver puzzle solution
 */
export function validateSequenceSolver(
  userAnswers: number[],
  puzzle: SequenceSolverData
): boolean {
  const { sequence, nextNItems } = puzzle;

  if (userAnswers.length !== nextNItems) {
    return false;
  }

  // Detect the pattern in the sequence
  // Check for arithmetic progression (constant difference)
  if (sequence.length >= 2) {
    const differences: number[] = [];
    for (let i = 1; i < sequence.length; i++) {
      differences.push(sequence[i] - sequence[i - 1]);
    }

    // Check if all differences are the same (arithmetic sequence)
    const isArithmetic = differences.every((d) => d === differences[0]);
    if (isArithmetic) {
      const commonDiff = differences[0];
      const expectedAnswers: number[] = [];
      for (let i = 0; i < nextNItems; i++) {
        expectedAnswers.push(sequence[sequence.length - 1] + commonDiff * (i + 1));
      }

      // Compare with user answers (allow small floating point errors)
      return userAnswers.every((ans, idx) => Math.abs(ans - expectedAnswers[idx]) < 0.001);
    }

    // Check for geometric progression (constant ratio)
    if (sequence.every((n) => n !== 0)) {
      const ratios: number[] = [];
      for (let i = 1; i < sequence.length; i++) {
        ratios.push(sequence[i] / sequence[i - 1]);
      }

      const isGeometric = ratios.every((r) => Math.abs(r - ratios[0]) < 0.001);
      if (isGeometric) {
        const commonRatio = ratios[0];
        const expectedAnswers: number[] = [];
        for (let i = 0; i < nextNItems; i++) {
          expectedAnswers.push(sequence[sequence.length - 1] * Math.pow(commonRatio, i + 1));
        }

        return userAnswers.every((ans, idx) => Math.abs(ans - expectedAnswers[idx]) < 0.001);
      }
    }

    // Check for Fibonacci-like sequence (each term is sum of previous two)
    if (sequence.length >= 3) {
      let isFibonacci = true;
      for (let i = 2; i < sequence.length; i++) {
        if (Math.abs(sequence[i] - (sequence[i - 1] + sequence[i - 2])) > 0.001) {
          isFibonacci = false;
          break;
        }
      }

      if (isFibonacci) {
        const expectedAnswers: number[] = [];
        let prev1 = sequence[sequence.length - 1];
        let prev2 = sequence[sequence.length - 2];
        for (let i = 0; i < nextNItems; i++) {
          const next = prev1 + prev2;
          expectedAnswers.push(next);
          prev2 = prev1;
          prev1 = next;
        }

        return userAnswers.every((ans, idx) => Math.abs(ans - expectedAnswers[idx]) < 0.001);
      }
    }
  }

  // If no pattern detected, return false
  return false;
}
