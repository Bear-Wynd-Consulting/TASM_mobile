import { config } from 'dotenv';
config();

import '@/ai/flows/translate-query.ts';
import '@/ai/flows/summarize-articles.ts';
import '@/ai/flows/generate-overall-summary.ts';
import '@/ai/flows/generate-facts-for-kids.ts';
import '@/ai/flows/generate-article-relations.ts';

