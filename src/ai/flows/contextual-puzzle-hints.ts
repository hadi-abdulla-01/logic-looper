'use server';
/**
 * @fileOverview A Genkit flow for providing contextual and subtle hints for logic puzzles.
 *
 * - getContextualPuzzleHint - A function that provides an intelligent hint based on puzzle progress.
 * - GetContextualPuzzleHintInput - The input type for the getContextualPuzzleHint function.
 * - GetContextualPuzzleHintOutput - The return type for the getContextualPuzzleHint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetContextualPuzzleHintInputSchema = z.object({
  puzzleType: z
    .string()
    .describe('The type of the puzzle (e.g., Number Matrix, Pattern Matching, Deduction Grid).'),
  puzzleDescription: z
    .string()
    .describe('A detailed description of the puzzle rules and its current state or layout.'),
  userProgress: z
    .string()
    .describe(
      'A description of the user\'s current progress, what they have tried, or the current state of their solution.'
    ),
  difficultyLevel: z
    .string()
    .describe('The current difficulty level of the puzzle (e.g., Easy, Medium, Hard).'),
});
export type GetContextualPuzzleHintInput = z.infer<
  typeof GetContextualPuzzleHintInputSchema
>;

const GetContextualPuzzleHintOutputSchema = z.object({
  hint: z
    .string()
    .describe('A subtle and guiding hint that helps the user progress without revealing the direct answer.'),
  hintCategory: z
    .string()
    .describe(
      'A category for the hint, such as "Strategy", "Focus Area", "Clarification", "Elimination", "Pattern Recognition".'
    ),
});
export type GetContextualPuzzleHintOutput = z.infer<
  typeof GetContextualPuzzleHintOutputSchema
>;

export async function getContextualPuzzleHint(
  input: GetContextualPuzzleHintInput
): Promise<GetContextualPuzzleHintOutput> {
  return contextualPuzzleHintsFlow(input);
}

const contextualPuzzleHintsPrompt = ai.definePrompt({
  name: 'contextualPuzzleHintsPrompt',
  input: {schema: GetContextualPuzzleHintInputSchema},
  output: {schema: GetContextualPuzzleHintOutputSchema},
  prompt: `You are an expert puzzle master, known for your ability to guide players to solutions without giving away the answer.
Your goal is to provide subtle, insightful hints that help the player understand the underlying logic and make progress on their own.

Analyze the following information to formulate a hint:

Puzzle Type: {{{puzzleType}}}
Puzzle Description:
"""
{{{puzzleDescription}}}
"""
User's Current Progress:
"""
{{{userProgress}}}
"""
Difficulty Level: {{{difficultyLevel}}}

Craft a hint that is subtle, guiding, and does NOT reveal the direct answer or any part of the direct solution. Focus on guiding principles, areas to re-examine, logical steps, or a specific strategy without directly providing the next move. Consider the difficulty level when crafting your hint; a harder puzzle might warrant a slightly more directed but still subtle hint.
`,
});

const contextualPuzzleHintsFlow = ai.defineFlow(
  {
    name: 'contextualPuzzleHintsFlow',
    inputSchema: GetContextualPuzzleHintInputSchema,
    outputSchema: GetContextualPuzzleHintOutputSchema,
  },
  async input => {
    const {output} = await contextualPuzzleHintsPrompt(input);
    return output!;
  }
);
