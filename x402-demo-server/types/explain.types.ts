import { z } from "zod";

export const explainRequestSchema = z.object({
  query: z.string().min(1, "Query is required"),
  learningStyle: z.enum(["academic", "visual", "practical", "interview", "beginner"]),
  depth: z.enum(["quick", "standard", "deep"]),
  examples: z.enum(["minimal", "balanced", "example-heavy"]),
  language: z.string().min(1, "Language is required"),
  sourceId: z.string().optional().nullable(),
  sourceType: z.enum(["pdf", "url", "web"]).optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  versionId: z.string().optional().nullable(),
});

// Flexible block schema — type is an open string so the model can emit
// academic, visual, practical and interview-specific block types
// (mental-model, flow, code, real-world, common-mistakes, interview-answer, etc.)
export const ExplainBlockSchema = z.object({
  id: z.string(),
  type: z.string(),             // open string — definition | explanation | example | takeaways |
                                //  mental-model | flow | code | real-world | common-mistakes |
                                //  interview-answer | follow-ups | trap | output | advantages |
                                //  limitations | terminology | related | summary
  title: z.string(),
  content: z.string().optional(),
  items: z.array(z.string()).optional(),
  nodes: z.array(z.string()).optional(),  // for "flow" blocks
  code: z.string().optional(),            // for "code" blocks
  language: z.string().optional(),        // programming language for code blocks
});

export const ExplainResponseSchema = z.object({
  topic: z.string(),
  preferences: z.object({
    learningStyle: z.string(),
    depth: z.string(),
    examples: z.string(),
    language: z.string(),
  }),
  blocks: z.array(ExplainBlockSchema),
});

export type ExplainRequest = z.infer<typeof explainRequestSchema>;
export type ExplainBlock = z.infer<typeof ExplainBlockSchema>;
export type ExplainResponse = z.infer<typeof ExplainResponseSchema>;
