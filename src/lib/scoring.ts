/**
 * Scoring system for Logic Looper puzzles
 * 
 * Formula:
 * - Base Score: Determined by puzzle difficulty
 * - Time Multiplier: Bonus for fast completion
 * - Hint Penalty: Deduction for using hints
 * 
 * Final Score = (Base Score × Time Multiplier) - Hint Penalty
 */

export type PuzzleType = 'NumberMatrix' | 'PatternMatching' | 'SequenceSolver' | 'DeductionGrid' | 'BinaryLogic';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert';

interface ScoreCalculationInput {
    puzzleType: PuzzleType;
    difficulty: DifficultyLevel;
    timeInSeconds: number;
    hintsUsed: number;
    isPerfect: boolean; // No mistakes made
}

interface ScoreBreakdown {
    baseScore: number;
    timeBonus: number;
    hintPenalty: number;
    perfectBonus: number;
    totalScore: number;
    rank: 'S' | 'A' | 'B' | 'C' | 'D';
}

// Base scores by difficulty
const BASE_SCORES: Record<DifficultyLevel, number> = {
    Easy: 100,
    Medium: 250,
    Hard: 500,
    Expert: 1000,
};

// Expected completion times (in seconds) for time multiplier calculation
const EXPECTED_TIMES: Record<DifficultyLevel, number> = {
    Easy: 120, // 2 minutes
    Medium: 300, // 5 minutes
    Hard: 600, // 10 minutes
    Expert: 900, // 15 minutes
};

// Hint penalty per hint used
const HINT_PENALTY_BASE = 50;

// Perfect completion bonus
const PERFECT_BONUS = 100;

/**
 * Calculate time bonus based on completion speed
 * Faster completion = higher multiplier (max 2x)
 * Slower completion = lower multiplier (min 0.5x)
 */
function calculateTimeMultiplier(timeInSeconds: number, difficulty: DifficultyLevel): number {
    const expectedTime = EXPECTED_TIMES[difficulty];

    if (timeInSeconds <= expectedTime * 0.5) {
        // Extremely fast - 2x multiplier
        return 2.0;
    } else if (timeInSeconds <= expectedTime) {
        // Fast - 1.5x to 2x multiplier (linear interpolation)
        const ratio = timeInSeconds / expectedTime;
        return 2.0 - (ratio * 0.5);
    } else if (timeInSeconds <= expectedTime * 2) {
        // Normal - 1x to 1.5x multiplier
        const ratio = (timeInSeconds - expectedTime) / expectedTime;
        return 1.5 - (ratio * 0.5);
    } else if (timeInSeconds <= expectedTime * 3) {
        // Slow - 0.75x to 1x multiplier
        const ratio = (timeInSeconds - expectedTime * 2) / expectedTime;
        return 1.0 - (ratio * 0.25);
    } else {
        // Very slow - 0.5x multiplier
        return 0.5;
    }
}

/**
 * Calculate hint penalty based on number of hints used
 */
function calculateHintPenalty(hintsUsed: number, difficulty: DifficultyLevel): number {
    const baseScore = BASE_SCORES[difficulty];
    // Each hint costs a percentage of base score, with diminishing returns
    let totalPenalty = 0;
    for (let i = 0; i < hintsUsed; i++) {
        const penaltyMultiplier = 1 / (i + 1); // First hint costs more
        totalPenalty += HINT_PENALTY_BASE * penaltyMultiplier;
    }
    // Cap penalty at 50% of base score
    return Math.min(totalPenalty, baseScore * 0.5);
}

/**
 * Determine rank based on final score and base score
 */
function calculateRank(totalScore: number, baseScore: number): 'S' | 'A' | 'B' | 'C' | 'D' {
    const ratio = totalScore / baseScore;

    if (ratio >= 2.0) return 'S'; // Exceptional
    if (ratio >= 1.5) return 'A'; // Excellent
    if (ratio >= 1.0) return 'B'; // Good
    if (ratio >= 0.7) return 'C'; // Average
    return 'D'; // Below average
}

/**
 * Calculate final score with breakdown
 */
export function calculateScore(input: ScoreCalculationInput): ScoreBreakdown {
    const baseScore = BASE_SCORES[input.difficulty];
    const timeMultiplier = calculateTimeMultiplier(input.timeInSeconds, input.difficulty);
    const timeBonus = Math.round(baseScore * (timeMultiplier - 1));
    const hintPenalty = Math.round(calculateHintPenalty(input.hintsUsed, input.difficulty));
    const perfectBonus = input.isPerfect ? PERFECT_BONUS : 0;

    const totalScore = Math.max(0, Math.round(
        (baseScore * timeMultiplier) - hintPenalty + perfectBonus
    ));

    const rank = calculateRank(totalScore, baseScore);

    return {
        baseScore,
        timeBonus,
        hintPenalty,
        perfectBonus,
        totalScore,
        rank,
    };
}

/**
 * Get difficulty level based on puzzle parameters
 */
export function getDifficultyLevel(puzzleType: PuzzleType, gridSize?: number): DifficultyLevel {
    switch (puzzleType) {
        case 'NumberMatrix':
            if (!gridSize) return 'Medium';
            if (gridSize <= 4) return 'Easy';
            if (gridSize <= 6) return 'Medium';
            if (gridSize <= 9) return 'Hard';
            return 'Expert';

        case 'PatternMatching':
            return 'Easy';

        case 'SequenceSolver':
            return 'Medium';

        case 'DeductionGrid':
            return 'Hard';

        case 'BinaryLogic':
            return 'Medium';

        default:
            return 'Medium';
    }
}
