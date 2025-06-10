// SummarizeArticles story implementation
'use server';
/**
 * @fileOverview Summarizes the top 10 most recent articles from a search query.
 *
 * - summarizeArticles - A function that summarizes the articles.
 * - SummarizeArticlesInput - The input type for the summarizeArticles function.
 * - SummarizeArticlesOutput - The return type for the summarizeArticles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeArticlesInputSchema = z.object({
  query: z.string().describe('The search query to use on Google Scholar.'),
  articleTitles: z.array(z.string()).describe('The titles of the articles to summarize.'),
  articleLinks: z.array(z.string()).describe('The links to the articles to summarize.'),
});
export type SummarizeArticlesInput = z.infer<typeof SummarizeArticlesInputSchema>;

const SummarizeArticlesOutputSchema = z.object({
  summaries: z.array(z.string()).describe('An array of summaries, one for each article, in the same order as presented in the input.'),
});
export type SummarizeArticlesOutput = z.infer<typeof SummarizeArticlesOutputSchema>;

export async function summarizeArticles(input: SummarizeArticlesInput): Promise<SummarizeArticlesOutput | null> {
  return summarizeArticlesFlow(input);
}

const summarizeArticlesPrompt = ai.definePrompt({
  name: 'summarizeArticlesPrompt',
  input: {schema: SummarizeArticlesInputSchema},
  output: {schema: SummarizeArticlesOutputSchema},
  prompt: `You are an expert summarizer of research papers.
Your goal is to provide a concise summary for each of the listed articles, focusing on its key findings.
The overall search query context for these articles is: "{{{query}}}"

Articles to summarize:
{{#each articleTitles}}
Article (Index {{@index}}):
Title: {{{this}}}
Link: {{lookup ../articleLinks @index}}
---
{{/each}}

Please provide your output STRICTLY as a JSON object with a single key "summaries". The value of "summaries" MUST be an array of strings. Each string in the array should be the summary for the corresponding article, maintaining the original order.
Example output format:
{
  "summaries": [
    "Summary for article at index 0...",
    "Summary for article at index 1...",
    // ... and so on for all articles
  ]
}
`,
});

const summarizeArticlesFlow = ai.defineFlow(
  {
    name: 'summarizeArticlesFlow',
    inputSchema: SummarizeArticlesInputSchema,
    outputSchema: SummarizeArticlesOutputSchema,
  },
  async input => {
    const {output} = await summarizeArticlesPrompt(input);
    return output; // Output can be null if parsing fails
  }
);

