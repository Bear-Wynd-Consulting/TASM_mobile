"use server";

import { z } from "zod";
import { translateQuery } from "@/ai/flows/translate-query";
import type { TranslateQueryOutput } from "@/ai/flows/translate-query";
import { summarizeArticles } from "@/ai/flows/summarize-articles";
import type { SummarizeArticlesOutput } from "@/ai/flows/summarize-articles";
import { generateOverallSummary } from "@/ai/flows/generate-overall-summary";
import type { GenerateOverallSummaryInput, GenerateOverallSummaryOutput } from "@/ai/flows/generate-overall-summary";
import { generateFactsForKids } from "@/ai/flows/generate-facts-for-kids";
import type { GenerateFactsForKidsInput, GenerateFactsForKidsOutput } from "@/ai/flows/generate-facts-for-kids";
import { generateArticleRelations } from "@/ai/flows/generate-article-relations";
import type { GenerateArticleRelationsInput, GenerateArticleRelationsOutput, ArticleRelationSchema as ArticleRelation } from "@/ai/flows/generate-article-relations";


const SearchFormSchema = z.object({
  naturalLanguageQuery: z
    .string()
    .min(3, "Query must be at least 3 characters.")
    .max(300, "Query must be at most 300 characters."),
});

export interface Article {
  title: string;
  link: string;
  summary?: string; 
}

export interface SearchActionResult {
  success: boolean;
  data?: {
    naturalLanguageQuery: string; 
    translatedQuery: string;
    googleScholarSearchLink: string;
    articles: Article[]; 
  };
  error?: string;
  fieldErrors?: { naturalLanguageQuery?: string[] };
}

// Helper function to generate somewhat plausible mock article titles
function generateMockArticleTitles(query: string, count: number): string[] {
  const titles: string[] = [];
  const queryKeywords = query.split(" ").slice(0, 3).join(" "); // Use first few keywords
  const baseTitles = [
    `Exploring the Impact of ${queryKeywords}`,
    `Recent Advances in ${queryKeywords} Research`,
    `A Comprehensive Review of ${queryKeywords} Applications`,
    `Future Trends in ${queryKeywords}`,
    `Challenges and Opportunities in ${queryKeywords}`,
    `The Role of ${queryKeywords} in Modern Science`,
    `Understanding ${queryKeywords}: A Deep Dive`,
    `Key Developments in the Field of ${queryKeywords}`,
    `Innovative Approaches to ${queryKeywords}`,
    `Cross-Disciplinary Perspectives on ${queryKeywords}`,
  ];

  for (let i = 0; i < count; i++) {
    titles.push(baseTitles[i % baseTitles.length] + (i >= baseTitles.length ? ` (Part ${Math.floor(i / baseTitles.length) + 1})` : ''));
  }
  return titles.slice(0, count);
}

export async function searchScholarAction(
  _prevState: SearchActionResult | undefined,
  formData: FormData
): Promise<SearchActionResult> {
  const naturalLanguageQuery = formData.get("naturalLanguageQuery") as string;

  const validationResult = SearchFormSchema.safeParse({ naturalLanguageQuery });
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid query.",
      fieldErrors: validationResult.error.flatten().fieldErrors,
    };
  }

  const validatedQuery = validationResult.data.naturalLanguageQuery;

  try {
    let translatedQueryOutput: TranslateQueryOutput;
    try {
      translatedQueryOutput = await translateQuery({ naturalLanguageQuery: validatedQuery });
    } catch (e) {
      console.error("Error translating query:", e);
      return { success: false, error: "Failed to translate your query. Please try again." };
    }
    
    const optimizedQuery = translatedQueryOutput.optimizedQuery;
    const googleScholarSearchLink = `https://scholar.google.com/scholar?q=${encodeURIComponent(optimizedQuery)}`;

    const articleCount = 10;
    const mockArticleTitles = generateMockArticleTitles(optimizedQuery, articleCount);
    const mockArticleLinks = mockArticleTitles.map(
      (title) => `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`
    );
    
    const articles: Article[] = mockArticleTitles.map((title, index) => ({
      title,
      link: mockArticleLinks[index],
    }));

    return {
      success: true,
      data: {
        naturalLanguageQuery: validatedQuery, 
        translatedQuery: optimizedQuery,
        googleScholarSearchLink,
        articles,
      },
    };
  } catch (error) {
    console.error("Unhandled error in searchScholarAction:", error);
    return { success: false, error: "An unexpected error occurred. Please try searching again." };
  }
}


const SummarizeArticlesPayloadSchema = z.object({
  articlesToSummarize: z.array(
    z.object({
      title: z.string(),
      link: z.string(),
    })
  ),
  queryContext: z.string(),
});

export interface SummarizeArticlesResult {
  success: boolean;
  summaries?: string[]; // individual summaries
  error?: string;
}

export async function getArticleSummariesAction(
  payload: z.infer<typeof SummarizeArticlesPayloadSchema>
): Promise<SummarizeArticlesResult> {
  const validationResult = SummarizeArticlesPayloadSchema.safeParse(payload);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid payload for summarization.",
    };
  }

  const { articlesToSummarize, queryContext } = validationResult.data;

  if (articlesToSummarize.length === 0) {
    return { success: true, summaries: [] };
  }

  const articleTitles = articlesToSummarize.map(a => a.title);
  const articleLinks = articlesToSummarize.map(a => a.link);

  try {
    const summariesOutput: SummarizeArticlesOutput | null = await summarizeArticles({
      query: queryContext,
      articleTitles,
      articleLinks,
    });

    if (!summariesOutput || !summariesOutput.summaries) {
      console.error("Failed to generate summaries or received malformed/null output from AI service for individual articles.");
      return { success: false, error: "The AI service failed to return individual summaries in the expected format. Please try again." };
    }
    
    let finalSummaries = summariesOutput.summaries;

    if (finalSummaries.length !== articlesToSummarize.length) {
      console.warn(
        `Individual summaries count mismatch. Expected: ${articlesToSummarize.length}, Got: ${finalSummaries.length}. Adjusting summaries.`
      );
      const defaultSummary = "Summary for this article is unavailable or was not provided in the correct sequence.";
      const adjustedSummaries: string[] = [];
      for (let i = 0; i < articlesToSummarize.length; i++) {
        adjustedSummaries.push(finalSummaries[i] || defaultSummary);
      }
      finalSummaries = adjustedSummaries;
    }
    
    return {
      success: true,
      summaries: finalSummaries,
    };
  } catch (e) {
    console.error("Error summarizing articles in getArticleSummariesAction:", e);
    return { success: false, error: "An unexpected error occurred while summarizing individual articles. Please try again." };
  }
}


const GenerateOverallSummaryPayloadSchema = z.object({
  queryContext: z.string(),
  articleSummaries: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
    })
  ),
});

export interface GenerateOverallSummaryResult {
  success: boolean;
  overallSummary?: string;
  error?: string;
}

export async function getOverallSummaryAction(
  payload: z.infer<typeof GenerateOverallSummaryPayloadSchema>
): Promise<GenerateOverallSummaryResult> {
  const validationResult = GenerateOverallSummaryPayloadSchema.safeParse(payload);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid payload for overall summarization.",
    };
  }

  const { queryContext, articleSummaries } = validationResult.data;

  if (articleSummaries.length === 0) {
    return { success: true, overallSummary: "No individual summaries available to create an overall summary." };
  }
  
  const flowInput: GenerateOverallSummaryInput = {
    queryContext,
    articleSummaries,
  };

  try {
    const overallSummaryOutput: GenerateOverallSummaryOutput | null = await generateOverallSummary(flowInput);

    if (!overallSummaryOutput || !overallSummaryOutput.overallSummary) {
      console.error("Failed to generate overall summary or received malformed/null output from AI service.");
      return { success: false, error: "The AI service failed to return an overall summary in the expected format. Please try again." };
    }
    
    return {
      success: true,
      overallSummary: overallSummaryOutput.overallSummary,
    };
  } catch (e) {
    console.error("Error generating overall summary in getOverallSummaryAction:", e);
    return { success: false, error: "An unexpected error occurred while generating the overall summary. Please try again." };
  }
}


const GenerateFactsForKidsPayloadSchema = z.object({
  queryContext: z.string(),
  overallSummary: z.string(),
});

export interface GenerateFactsForKidsResult {
  success: boolean;
  factsForKidsText?: string;
  error?: string;
}

export async function getFactsForKidsAction(
  payload: z.infer<typeof GenerateFactsForKidsPayloadSchema>
): Promise<GenerateFactsForKidsResult> {
  const validationResult = GenerateFactsForKidsPayloadSchema.safeParse(payload);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid payload for generating facts for kids.",
    };
  }

  const { queryContext, overallSummary } = validationResult.data;

  if (!overallSummary) {
     return { success: false, error: "Overall summary is required to generate facts for kids." };
  }
  if (!queryContext) {
    return { success: false, error: "Query context is required to generate facts for kids." };
  }

  const flowInput: GenerateFactsForKidsInput = {
    queryContext,
    overallSummary,
  };

  try {
    const factsForKidsOutput: GenerateFactsForKidsOutput | null = await generateFactsForKids(flowInput);

    if (!factsForKidsOutput || !factsForKidsOutput.factsForKidsText) {
      console.error("Failed to generate facts for kids or received malformed/null output from AI service.");
      return { success: false, error: "The AI service failed to return facts for kids in the expected format. Please try again." };
    }
    
    return {
      success: true,
      factsForKidsText: factsForKidsOutput.factsForKidsText,
    };
  } catch (e) {
    console.error("Error generating facts for kids in getFactsForKidsAction:", e);
    return { success: false, error: "An unexpected error occurred while generating facts for kids. Please try again." };
  }
}

// Schema for Article Relations action payload
const GenerateArticleRelationsPayloadSchema = z.object({
  queryContext: z.string(),
  articles: z.array(
    z.object({
      title: z.string(),
      summary: z.string().optional(), // Summary is crucial for this flow
    })
  ),
});

export interface ArticleRelationItem {
  theme: string;
  relatedArticleTitles: string[];
}
export interface GenerateArticleRelationsResult {
  success: boolean;
  relations?: ArticleRelationItem[];
  error?: string;
}

export async function getArticleRelationsAction(
  payload: z.infer<typeof GenerateArticleRelationsPayloadSchema>
): Promise<GenerateArticleRelationsResult> {
  const validationResult = GenerateArticleRelationsPayloadSchema.safeParse(payload);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid payload for generating article relations.",
    };
  }

  const { queryContext, articles } = validationResult.data;

  const articlesWithSummaries = articles.filter(
    (article): article is { title: string; summary: string } => !!article.summary && article.summary.trim() !== ""
  );

  if (articlesWithSummaries.length === 0) {
    return { success: false, error: "At least one article with a summary is required to generate relations." };
  }
  if (!queryContext) {
    return { success: false, error: "Query context is required to generate article relations." };
  }
  
  const flowInput: GenerateArticleRelationsInput = {
    queryContext,
    articles: articlesWithSummaries,
  };

  try {
    const relationsOutput: GenerateArticleRelationsOutput | null = await generateArticleRelations(flowInput);

    if (!relationsOutput || !relationsOutput.relations) {
      console.error("Failed to generate article relations or received malformed/null output from AI service.");
      return { success: false, error: "The AI service failed to return article relations in the expected format. Please try again." };
    }
    
    return {
      success: true,
      relations: relationsOutput.relations,
    };
  } catch (e) {
    console.error("Error generating article relations in getArticleRelationsAction:", e);
    return { success: false, error: "An unexpected error occurred while generating article relations. Please try again." };
  }
}
