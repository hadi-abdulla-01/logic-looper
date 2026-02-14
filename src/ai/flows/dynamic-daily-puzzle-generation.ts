'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating daily logic puzzles.
 * It uses a simulated deterministic algorithm as a tool to ensure unique and progressive challenges
 * based on the current date and user progression level.
 *
 * - generateDailyPuzzle - The main function to generate a daily puzzle.
 * - GenerateDailyPuzzleInput - The input type for the generateDailyPuzzle function.
 * - GenerateDailyPuzzleOutput - The return type for the generateDailyPuzzle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// --- Input Schema ---
const GenerateDailyPuzzleInputSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Current date in YYYY-MM-DD format.'),
  userProgressionLevel: z
    .number()
    .int()
    .min(1)
    .describe('User\'s current progression level, influencing puzzle difficulty.'),
});
export type GenerateDailyPuzzleInput = z.infer<
  typeof GenerateDailyPuzzleInputSchema
>;

// --- Output Schema ---
const PuzzleDataSchema = z.union([
  z.object({
    type: z.literal('NumberMatrix'),
    gridSize: z.number().int().min(3).max(9),
    filledCells: z.array(z.object({row: z.number(), col: z.number(), value: z.number()})),
    rules: z.array(z.string()),
  }),
  z.object({
    type: z.literal('PatternMatching'),
    patternSequence: z.array(z.string()), // e.g., array of shapes or colors
    missingElementIndex: z.number(),
    options: z.array(z.string()),
  }),
  z.object({
    type: z.literal('SequenceSolver'),
    sequence: z.array(z.number()), // e.g., Fibonacci, arithmetic progression
    nextNItems: z.number(),
    description: z.string(),
  }),
  z.object({
    type: z.literal('DeductionGrid'),
    categories: z.array(z.string()), // e.g., names, colors, pets
    itemsPerCategory: z.number(),
    clues: z.array(z.string()),
  }),
  z.object({
    type: z.literal('BinaryLogic'),
    circuitDescription: z.string(), // Textual description of a binary circuit
    inputs: z.record(z.boolean()), // e.g., {A: true, B: false}
    expectedOutputs: z.record(z.boolean()).optional(), // What the user needs to determine
  }),
]);

const GenerateDailyPuzzleOutputSchema = z.object({
  puzzleType: z
    .enum([
      'NumberMatrix',
      'PatternMatching',
      'SequenceSolver',
      'DeductionGrid',
      'BinaryLogic',
    ])
    .describe('The type of logic puzzle generated.'),
  puzzleTitle: z.string().describe('A concise and engaging title for the daily puzzle.'),
  puzzleDescription: z
    .string()
    .describe('Clear and comprehensive instructions for solving the puzzle.'),
  puzzleData: PuzzleDataSchema.describe(
    'Structured data representing the puzzle content. The exact structure depends on the puzzleType.'
  ),
  solutionHint: z.string().optional().describe('An optional, subtle hint to guide the player.'),
});
export type GenerateDailyPuzzleOutput = z.infer<
  typeof GenerateDailyPuzzleOutputSchema
>;

// --- Tool for Simulated Deterministic Puzzle Content Generation ---
// This tool simulates the "deterministic algorithm" mentioned in the prompt.
// In a real application, this would be a sophisticated client-side or backend
// service that generates actual puzzle mechanics based on date and progression.
// Here, it provides structured data for the LLM to elaborate on.
const generateDeterministicPuzzleContent = ai.defineTool(
  {
    name: 'generateDeterministicPuzzleContent',
    description:
      'Generates structured data for a logic puzzle based on the current date and user progression level. This ensures a unique and deterministically chosen puzzle daily.',
    inputSchema: z.object({
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe('Current date in YYYY-MM-DD format.'),
      progressionLevel: z
        .number()
        .int()
        .min(1)
        .describe('User\'s current progression level, influencing puzzle complexity.'),
    }),
    outputSchema: PuzzleDataSchema,
  },
  async ({date, progressionLevel}) => {
    // Simulate deterministic generation based on date and progression.
    const dateObj = new Date(date);
    const dayOfMonth = dateObj.getDate();
    const puzzleTypes = [
      'NumberMatrix',
      'PatternMatching',
      'SequenceSolver',
      'DeductionGrid',
      'BinaryLogic',
    ] as const;
    const selectedType = puzzleTypes[dayOfMonth % puzzleTypes.length]; // Deterministic selection

    let puzzleContent: z.infer<typeof PuzzleDataSchema>;

    // Placeholder content for demonstration. In a real app, this would be complex logic.
    switch (selectedType) {
      case 'NumberMatrix':
        const numMatrixGridSize = Math.min(6, 3 + Math.floor(progressionLevel / 5));
        const seed = dateObj.getDate() + dateObj.getMonth() + dateObj.getFullYear() + progressionLevel;
        const filled: {row: number, col: number, value: number}[] = [];
        // Deterministically generate a few cells based on seed
        const numFilled = Math.min(numMatrixGridSize * numMatrixGridSize / 4, 2 + Math.floor(progressionLevel / 4)); // More cells for higher progression
        for (let i = 0; i < numFilled; i++) {
            const row = (seed + i) % numMatrixGridSize;
            const col = (seed + i * 2) % numMatrixGridSize;
            const value = ((seed + i * 3) % numMatrixGridSize) + 1;
            filled.push({row, col, value});
        }
        puzzleContent = {
          type: 'NumberMatrix',
          gridSize: numMatrixGridSize,
          filledCells: filled,
          rules: [
            `Fill the ${numMatrixGridSize}x${numMatrixGridSize} grid with numbers 1 to ${numMatrixGridSize} such that each row, column, and sub-grid (if applicable) contains each number exactly once.`,
            'Some cells are pre-filled as hints.',
          ],
        };
        break;
      case 'PatternMatching':
        puzzleContent = {
          type: 'PatternMatching',
          patternSequence: ['red_square', 'blue_circle', 'green_triangle', 'red_square', 'blue_circle'],
          missingElementIndex: 5, // The next element
          options: ['green_triangle', 'yellow_star', 'orange_hexagon'],
        };
        break;
      case 'SequenceSolver':
        const start = progressionLevel * 2;
        puzzleContent = {
          type: 'SequenceSolver',
          sequence: [start, start + 3, start + 6, start + 9],
          nextNItems: 2,
          description: 'Determine the pattern and find the next two numbers in the sequence.',
        };
        break;
      case 'DeductionGrid':
        puzzleContent = {
          type: 'DeductionGrid',
          categories: ['Names', 'Pets', 'Colors'],
          itemsPerCategory: Math.min(4, 2 + Math.floor(progressionLevel / 10)), // Max 4
          clues: [
            'The person who owns the cat likes blue.',
            'Emily does not own the dog.',
            'The green item is not owned by John.',
          ],
        };
        break;
      case 'BinaryLogic':
        puzzleContent = {
          type: 'BinaryLogic',
          circuitDescription: `A simple circuit with two inputs, A and B. It passes through an AND gate, then an OR gate with a third input C. The final output is D. Determine D given A, B, and C.`,
          inputs: {A: true, B: false, C: true},
          expectedOutputs: undefined, // User needs to determine
        };
        break;
      default:
        // Fallback for types not explicitly handled, or for a default puzzle.
        puzzleContent = {
          type: 'NumberMatrix', // Default to a simpler type
          gridSize: 4,
          filledCells: [],
          rules: ['Fill the grid to satisfy basic number placement rules.'],
        };
    }
    return puzzleContent;
  }
);

// --- Genkit Prompt Definition ---
const dynamicDailyPuzzlePrompt = ai.definePrompt({
  name: 'dynamicDailyPuzzlePrompt',
  input: {schema: GenerateDailyPuzzleInputSchema},
  output: {schema: GenerateDailyPuzzleOutputSchema},
  tools: [generateDeterministicPuzzleContent],
  prompt: `You are an expert puzzle designer for the "Logic Looper" game.\nYour task is to create a unique and engaging daily logic puzzle for a player.\n\nFirst, you MUST use the 'generateDeterministicPuzzleContent' tool with the provided date and user progression level to get the core structure of today's puzzle.\nBased on the structured puzzle data returned by the tool, craft a compelling title, a clear description with instructions, and an optional subtle hint for the puzzle.\nEnsure the title is catchy, the description is easy to understand, and the hint is just enough to nudge the player without giving away the solution.\n\nCurrent Date: {{{date}}}\nUser Progression Level: {{{userProgressionLevel}}}`,
});

// --- Genkit Flow Definition ---
const dynamicDailyPuzzleGenerationFlow = ai.defineFlow(
  {
    name: 'dynamicDailyPuzzleGenerationFlow',
    inputSchema: GenerateDailyPuzzleInputSchema,
    outputSchema: GenerateDailyPuzzleOutputSchema,
  },
  async input => {
    // The prompt explicitly instructs the LLM to use the tool first.
    // The LLM will call the tool, receive its output, and then generate the final puzzle details.
    const {output} = await dynamicDailyPuzzlePrompt(input);
    if (!output) {
      throw new Error('Failed to generate puzzle output.');
    }
    return output;
  }
);

// --- Exported Wrapper Function ---
export async function generateDailyPuzzle(
  input: GenerateDailyPuzzleInput
): Promise<GenerateDailyPuzzleOutput> {
  return dynamicDailyPuzzleGenerationFlow(input);
}
