export type PuzzleType =
  | 'NumberMatrix'
  | 'PatternMatching'
  | 'SequenceSolver'
  | 'DeductionGrid'
  | 'BinaryLogic';

export type NumberMatrixData = {
  type: 'NumberMatrix';
  gridSize: number;
  filledCells: { row: number; col: number; value: number }[];
  rules: string[];
};

export type PatternMatchingData = {
  type: 'PatternMatching';
  patternSequence: string[];
  missingElementIndex: number;
  options: string[];
};

export type SequenceSolverData = {
  type: 'SequenceSolver';
  sequence: number[];
  nextNItems: number;
  description: string;
};

export type DeductionGridData = {
  type: 'DeductionGrid';
  categories: string[];
  itemsPerCategory: number;
  clues: string[];
};

export type BinaryLogicData = {
  type: 'BinaryLogic';
  circuitDescription: string;
  inputs: Record<string, boolean>;
  expectedOutputs?: Record<string, boolean>;
};

export type PuzzleData =
  | NumberMatrixData
  | PatternMatchingData
  | SequenceSolverData
  | DeductionGridData
  | BinaryLogicData;

export type DailyPuzzle = {
  puzzleType: PuzzleType;
  puzzleTitle: string;
  puzzleDescription: string;
  puzzleData: PuzzleData;
  solutionHint?: string;
};

export type ContextualHint = {
  hint: string;
  hintCategory: string;
};
