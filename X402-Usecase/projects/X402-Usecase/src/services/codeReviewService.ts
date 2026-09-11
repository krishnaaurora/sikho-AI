import { API_BASE_URL } from '../config/api';

export interface CodeReviewRequest {
  code: string;
  language?: string;
  problemStatement?: string;
}

export interface CodeReviewResult {
  score: number;
  review: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

/**
 * Service to submit code to friend's AI Code Review API / backend proxy endpoint
 */
export async function submitCodeReview(request: CodeReviewRequest): Promise<CodeReviewResult> {
  const customEndpoint = import.meta.env.VITE_CODE_REVIEW_API_URL;
  const endpoint = customEndpoint || `${API_BASE_URL}/code-review`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        code: request.code,
        language: request.language || 'cpp',
        problemStatement: request.problemStatement || 'Algorithm and syntax review',
      }),
    });

    const data = await res.json();
    if (!res.ok || (!data.success && !data.score)) {
      throw new Error(data.message || 'Code review request failed.');
    }

    return data.data || data;
  } catch (err: any) {
    console.error('Error submitting code review:', err);
    throw new Error(err.message || 'Unable to complete code review. Please try again.');
  }
}
