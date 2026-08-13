import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { generateMindMapTree } from "../../services/explain/mindmap.service";
import { LearningSource } from "../../models/LearningSource.model";
import { retrieveRelevantChunks } from "../../services/explain/retrieval.service";

export const getMindMap = asyncHandler(async (req: Request, res: Response) => {
  const { topic, sourceId, explanationId } = req.body;
  
  let retrievedTextContext = "";
  if (sourceId) {
    const source = await LearningSource.findById(sourceId);
    if (source) {
      const chunks = retrieveRelevantChunks(topic || source.name, source, 6);
      retrievedTextContext = chunks.map(c => c.text).join("\n\n");
    }
  }

  const resolvedTopic = topic || (explanationId ? `Concept ${explanationId}` : "Course Concept");
  const mindMap = await generateMindMapTree(resolvedTopic, retrievedTextContext);
  return sendSuccessResponse(res, mindMap, "Mind map generated successfully");
});
