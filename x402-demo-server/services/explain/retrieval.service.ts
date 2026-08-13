import { ILearningSource } from "../../models/LearningSource.model";
import { logger } from "../../utils/logger";

export interface RetrievalResult {
  chunkId: string;
  text: string;
  pageNumber?: number;
  heading?: string;
  score: number;
}

/**
 * Performs a simple, fast keyword-based TF-IDF/Overlap RAG search 
 * over the chunks of a stored LearningSource.
 */
export function retrieveRelevantChunks(
  query: string,
  source: ILearningSource,
  limit: number = 5
): RetrievalResult[] {
  const queryTerms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTerms.length === 0) {
    // Fallback to top chunks if query is empty or too short
    return source.chunks.slice(0, limit).map((c) => ({
      chunkId: c.id,
      text: c.text,
      pageNumber: c.pageNumber,
      heading: c.heading,
      score: 1.0
    }));
  }

  const scored = source.chunks.map((chunk) => {
    const textLower = chunk.text.toLowerCase();
    let score = 0;

    queryTerms.forEach((term) => {
      // Overlap count scoring
      const occurrences = textLower.split(term).length - 1;
      score += occurrences;
    });

    return {
      chunkId: chunk.id,
      text: chunk.text,
      pageNumber: chunk.pageNumber,
      heading: chunk.heading,
      score
    };
  });

  // Sort by score descending and return top-limit
  const filtered = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (filtered.length === 0) {
    // If no keywords match, fall back to first few paragraphs
    return source.chunks.slice(0, limit).map((c) => ({
      chunkId: c.id,
      text: c.text,
      pageNumber: c.pageNumber,
      heading: c.heading,
      score: 0.1
    }));
  }

  return filtered.slice(0, limit);
}
