'use server';

/**
 * @fileOverview Translates a natural language query into an optimized search query for Google Scholar.
 *
 * - translateQuery - A function that translates the query.
 * - TranslateQueryInput - The input type for the translateQuery function.
 * - TranslateQueryOutput - The return type for the translateQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateQueryInputSchema = z.object({
  naturalLanguageQuery: z
    .string()
    .describe('The natural language query to translate.'),
});
export type TranslateQueryInput = z.infer<typeof TranslateQueryInputSchema>;

const TranslateQueryOutputSchema = z.object({
  optimizedQuery: z
    .string()
    .describe('The optimized search query for Google Scholar.'),
});
export type TranslateQueryOutput = z.infer<typeof TranslateQueryOutputSchema>;

export async function translateQuery(
  input: TranslateQueryInput
): Promise<TranslateQueryOutput> {
  return translateQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateQueryPrompt',
  input: {schema: TranslateQueryInputSchema},
  output: {schema: TranslateQueryOutputSchema},
  prompt: `You are an expert in translating natural language queries into optimized search queries for Google Scholar.

  Translate the following natural language query into an optimized search query for Google Scholar:
  """
  {{naturalLanguageQuery}}
  """
  `,
});

const translateQueryFlow = ai.defineFlow(
  {
    name: 'translateQueryFlow',
    inputSchema: TranslateQueryInputSchema,
    outputSchema: TranslateQueryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
