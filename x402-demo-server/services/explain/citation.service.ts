import { RetrievalResult } from "./retrieval.service";

export interface Citation {
  sourceId: string;
  sourceName: string;
  pageOrUrl?: string;
  chunkText: string;
}

/**
 * Builds standard metadata citations for retrieved source segments.
 */
export function buildCitations(
  retrieved: RetrievalResult[],
  sourceId: string,
  sourceName: string,
  sourceType: "pdf" | "url"
): Citation[] {
  return retrieved.map((item) => {
    let pageOrUrl = "";
    if (sourceType === "pdf") {
      pageOrUrl = item.pageNumber ? `Page ${item.pageNumber}` : "Unknown Page";
    } else {
      pageOrUrl = sourceName;
    }
    return {
      sourceId,
      sourceName,
      pageOrUrl,
      chunkText: item.text
    };
  });
}
