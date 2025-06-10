'use server';
/**
 * @fileOverview Generates an overall summary from a list of article titles and their individual summaries.
 *
 * - generateOverallSummary - A function that generates the overall summary.
 * - GenerateOverallSummaryInput - The input type for the generateOverallSummary function.
 * - GenerateOverallSummaryOutput - The return type for the generateOverallSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ArticleSummaryInputSchema = z.object({
  title: z.string().describe('The title of the article.'),
  summary: z.string().describe('The individual summary of the article.'),
});

const GenerateOverallSummaryInputSchema = z.object({
  queryContext: z.string().describe('The original search query context.'),
  articleSummaries: z.array(ArticleSummaryInputSchema).describe('An array of articles with their titles and individual summaries.'),
});
export type GenerateOverallSummaryInput = z.infer<typeof GenerateOverallSummaryInputSchema>;

const GenerateOverallSummaryOutputSchema = z.object({
  overallSummary: z.string().describe('A single, concise overall summary synthesizing the key findings and themes.'),
});
export type GenerateOverallSummaryOutput = z.infer<typeof GenerateOverallSummaryOutputSchema>;

export async function generateOverallSummary(input: GenerateOverallSummaryInput): Promise<GenerateOverallSummaryOutput | null> {
  return generateOverallSummaryFlow(input);
}

const generateOverallSummaryPrompt = ai.definePrompt({
  name: 'generateOverallSummaryPrompt',
  input: {schema: GenerateOverallSummaryInputSchema},
  output: {schema: GenerateOverallSummaryOutputSchema},
  prompt: `You are an expert in synthesizing information from multiple research paper summaries.
Your goal is to provide a single, concise overall summary that synthesizes the key findings and themes from the provided individual article summaries, in relation to the original search query. The summary should be a coherent paragraph or a few paragraphs if necessary.

Original search query context: "{{{queryContext}}}"

Individual article summaries:
{{#each articleSummaries}}
Article Title: {{{this.title}}}
Individual Summary: {{{this.summary}}}
---
{{/each}}

Please generate an overall summary based on the information above.
Ensure your output is STRICTLY a JSON object with a single key "overallSummary".
Example output format:
{
  "overallSummary": "The collective findings from these articles suggest that..."
}
`,
});

const generateOverallSummaryFlow = ai.defineFlow(
  {
    name: 'generateOverallSummaryFlow',
    inputSchema: GenerateOverallSummaryInputSchema,
    outputSchema: GenerateOverallSummaryOutputSchema,
  },
  async input => {
    if (input.articleSummaries.length === 0) {
      return { overallSummary: "No article summaries were provided to generate an overall summary." };
    }
    const {output} = await generateOverallSummaryPrompt(input);
    return output; // Output can be null if parsing fails
  }
);
