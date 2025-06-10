'use server';
/**
 * @fileOverview Identifies common themes/keywords in a list of articles and groups articles by these themes.
 *
 * - generateArticleRelations - A function that generates the article relationship data.
 * - GenerateArticleRelationsInput - The input type for the generateArticleRelations function.
 * - GenerateArticleRelationsOutput - The return type for the generateArticleRelations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ArticleInputSchema = z.object({
  title: z.string().describe('The title of the article.'),
  summary: z.string().describe('The summary of the article.'),
});

const GenerateArticleRelationsInputSchema = z.object({
  queryContext: z.string().describe('The original search query context.'),
  articles: z.array(ArticleInputSchema).describe('An array of articles with their titles and summaries.'),
});
export type GenerateArticleRelationsInput = z.infer<typeof GenerateArticleRelationsInputSchema>;

const ArticleRelationSchema = z.object({
  theme: z.string().describe('A common theme or keyword identified across the articles.'),
  relatedArticleTitles: z.array(z.string()).describe('A list of article titles that are relevant to this theme.'),
});

const GenerateArticleRelationsOutputSchema = z.object({
  relations: z.array(ArticleRelationSchema).describe('An array of themes and their related articles.'),
});
export type GenerateArticleRelationsOutput = z.infer<typeof GenerateArticleRelationsOutputSchema>;

export async function generateArticleRelations(input: GenerateArticleRelationsInput): Promise<GenerateArticleRelationsOutput | null> {
  return generateArticleRelationsFlow(input);
}

const generateArticleRelationsPrompt = ai.definePrompt({
  name: 'generateArticleRelationsPrompt',
  input: {schema: GenerateArticleRelationsInputSchema},
  output: {schema: GenerateArticleRelationsOutputSchema},
  prompt: `You are an expert in analyzing academic papers and identifying thematic connections.
Given the original search query context and a list of articles with their titles and summaries, please perform the following:
1. Identify 3-5 prominent common themes or keywords that connect several of these articles.
2. For each identified theme/keyword, list the titles of the articles that are most relevant to it. An article can be listed under multiple themes if applicable.
3. Focus on the relationships and shared concepts revealed in the summaries.

Original Query Context: "{{{queryContext}}}"

Articles:
{{#each articles}}
Title: {{{this.title}}}
Summary: {{{this.summary}}}
---
{{/each}}

Please provide your output STRICTLY as a JSON object with a single key "relations".
The value of "relations" should be an array of objects, where each object has two keys:
- "theme": A string representing the common theme or keyword.
- "relatedArticleTitles": An array of strings, where each string is the title of an article relevant to that theme.

Example output format:
{
  "relations": [
    {
      "theme": "Impact of AI on Job Market",
      "relatedArticleTitles": ["Article Title A", "Article Title C", "Article Title E"]
    },
    {
      "theme": "Machine Learning Techniques",
      "relatedArticleTitles": ["Article Title B", "Article Title D"]
    },
    {
      "theme": "Ethical Considerations in AI",
      "relatedArticleTitles": ["Article Title A", "Article Title D", "Article Title F"]
    }
  ]
}
`,
});

const generateArticleRelationsFlow = ai.defineFlow(
  {
    name: 'generateArticleRelationsFlow',
    inputSchema: GenerateArticleRelationsInputSchema,
    outputSchema: GenerateArticleRelationsOutputSchema,
  },
  async input => {
    if (input.articles.length === 0) {
      return { relations: [] };
    }
    // Ensure all articles have summaries, as the prompt relies on them
    const articlesWithSummaries = input.articles.filter(article => article.summary && article.summary.trim() !== "");
    if (articlesWithSummaries.length === 0) {
        return { relations: [] }; // Or handle as an error if summaries are strictly required
    }

    const {output} = await generateArticleRelationsPrompt({
        ...input,
        articles: articlesWithSummaries
    });
    return output;
  }
);
