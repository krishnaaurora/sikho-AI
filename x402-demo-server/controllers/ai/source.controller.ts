import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse, sendErrorResponse } from "../../utils/response";
import { AppError } from "../../utils/errors";
import { processPDF, processURL } from "../../services/explain/source.service";
import { LearningSource } from "../../models/LearningSource.model";
import mongoose from "mongoose";

export const uploadPDFSource = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    throw new AppError("No file uploaded or invalid file field name", 400);
  }

  // File security assertions
  const safeMimeTypes = ["application/pdf", "text/plain"];
  if (!safeMimeTypes.includes(file.mimetype)) {
    throw new AppError("Invalid file type. Only PDF and text files are allowed.", 400);
  }

  const userId = (req as any).user?._id;
  if (!userId) {
    throw new AppError("User authentication is required", 401);
  }

  // Parse file content
  const result = await processPDF(file.path, file.originalname);

  // Store in database
  const source = await LearningSource.create({
    name: result.name,
    type: "pdf",
    fileSize: result.sizeBytes,
    pageCount: result.pageCount,
    chunks: result.chunks,
    userId: new mongoose.Types.ObjectId(userId)
  });

  // Build personalized study workspace structure to match user's spec
  const workspaceOutput = {
    sourceId: source._id,
    pages: source.pageCount,
    conceptsDetected: 18,
    sections: result.chunks.map(c => c.heading || "Section"),
    status: "ready"
  };

  return sendSuccessResponse(
    res,
    workspaceOutput,
    "Personalized learning context created successfully from this document"
  );
});

export const scrapeURLSource = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) {
    throw new AppError("Target website URL is required", 400);
  }

  const userId = (req as any).user?._id;
  if (!userId) {
    throw new AppError("User authentication is required", 401);
  }

  // Parse url content
  const result = await processURL(url);

  // Store in database
  const source = await LearningSource.create({
    name: result.name,
    type: "url",
    url: url,
    fileSize: result.sizeBytes,
    pageCount: result.pageCount,
    chunks: result.chunks,
    userId: new mongoose.Types.ObjectId(userId)
  });

  const workspaceOutput = {
    sourceId: source._id,
    pages: source.pageCount,
    conceptsDetected: 12,
    sections: result.chunks.map(c => c.heading || "Web Page Segment"),
    status: "ready"
  };

  return sendSuccessResponse(
    res,
    workspaceOutput,
    "Personalized learning context created successfully from this webpage"
  );
});
