'use server';
/**
 * @fileOverview Generates kid-friendly explanations from an overall summary and query context.
 *
 * - generateFactsForKids - A function that generates the kid-friendly content.
 * - GenerateFactsForKidsInput - The input type for the generateFactsForKids function.
 * - GenerateFactsForKidsOutput - The return type for the generateFactsForKids function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFactsForKidsInputSchema = z.object({
  queryContext: z.string().describe('The original search query context.'),
  overallSummary: z.string().describe('The overall summary of the academic papers.'),
});
export type GenerateFactsForKidsInput = z.infer<typeof GenerateFactsForKidsInputSchema>;

const GenerateFactsForKidsOutputSchema = z.object({
  factsForKidsText: z.string().describe('A simplified explanation of the summary suitable for a 10-15 year old.'),
});
export type GenerateFactsForKidsOutput = z.infer<typeof GenerateFactsForKidsOutputSchema>;

export async function generateFactsForKids(input: GenerateFactsForKidsInput): Promise<GenerateFactsForKidsOutput | null> {
  return generateFactsForKidsFlow(input);
}

const generateFactsForKidsPrompt = ai.definePrompt({
  name: 'generateFactsForKidsPrompt',
  input: {schema: GenerateFactsForKidsInputSchema},
  output: {schema: GenerateFactsForKidsOutputSchema},
  prompt: `You are an expert science communicator skilled at explaining complex topics to young teenagers (10-15 years old).
Based on the original research query context and the provided overall summary of academic papers, please generate a 'Facts for Kids' section. This section should:
1. Simplify complex terminology and concepts from the summary.
2. Use age-appropriate language and examples.
3. Highlight the most interesting or relevant facts for this age group.
4. Be engaging and easy to understand.
5. Maintain factual accuracy.

Original Query Context: "{{{queryContext}}}"

Overall Summary of Papers:
"""
{{{overallSummary}}}
"""

Please provide your output STRICTLY as a JSON object with a single key "factsForKidsText".
The text should be formatted with paragraphs if appropriate.

Example output format:
{
  "factsForKidsText": "Imagine scientists are like detectives trying to solve a big puzzle about [simplified topic from queryContext]! They looked at lots of clues (the papers) and found out that [simplified key finding 1 from overallSummary]. For example, [simple analogy or example].\\n\\nAnother cool thing they discovered is [simplified key finding 2 from overallSummary]..."
}
`,
});

const generateFactsForKidsFlow = ai.defineFlow(
  {
    name: 'generateFactsForKidsFlow',
    inputSchema: GenerateFactsForKidsInputSchema,
    outputSchema: GenerateFactsForKidsOutputSchema,
  },
  async input => {
    if (!input.overallSummary) {
      return { factsForKidsText: "No overall summary was provided to generate facts for kids." };
    }
    const {output} = await generateFactsForKidsPrompt(input);
    return output;
  }
);
