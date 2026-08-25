import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/errors";
import { sendSuccessResponse } from "../../utils/response";
import Resume from "../../models/Resume.model";
import path from "path";
import {
  extractRawText,
  extractStructuredData,
  computeSectionStatuses,
  detectDocumentType,
} from "../../services/resumeExtraction.service";

// ─────────────────────────────────────────────────────────────────
// POST /api/resume/upload
// ─────────────────────────────────────────────────────────────────
export const uploadResume = asyncHandler(async (req: any, res: Response) => {
  const file = req.file;
  if (!file) {
    throw new AppError("No file uploaded. Please upload a PDF or DOCX file.", 400);
  }

  // Validate extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (![".pdf", ".doc", ".docx"].includes(ext)) {
    throw new AppError("Invalid file type. Only PDF, DOC, and DOCX files are allowed.", 400);
  }

  // Validate size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new AppError("File is too large. Size limit is 10MB.", 400);
  }

  const userId = req.user ? req.user._id : null;

  // 1. Create a Resume document with PROCESSING status immediately
  const resume = await Resume.create({
    userId,
    fileName: file.originalname,
    fileUrl: `/uploads/documents/${file.filename}`,
    fileSize: file.size,
    mimeType: file.mimetype,
    status: "PROCESSING",
    rawText: "",
  });

  // 2. Kick off extraction asynchronously (do NOT await — return fast to client)
  runExtractionPipeline(resume._id.toString(), file.path, file.originalname).catch((err) => {
    console.error(`[ExtractionPipeline] Failed for resume ${resume._id}:`, err.message);
  });

  return sendSuccessResponse(
    res,
    {
      resumeId: resume._id,
      userId: resume.userId,
      fileUrl: resume.fileUrl,
      status: resume.status,
    },
    "Resume uploaded successfully. Extraction in progress."
  );
});

// ─────────────────────────────────────────────────────────────────
// BACKGROUND: Full PDF→Text→Groq→DB Pipeline
// ─────────────────────────────────────────────────────────────────
async function runExtractionPipeline(resumeId: string, filePath: string, fileName: string): Promise<void> {
  try {
    console.log(`[ExtractionPipeline] Starting for ${fileName} (${resumeId})`);

    // Step 1: Extract raw text
    const rawText = await extractRawText(filePath);
    console.log(`[ExtractionPipeline] Raw text extracted: ${rawText.length} chars`);

    // Step 1.5: Detect document type — bail early if it's not a resume
    const docType = await detectDocumentType(rawText);
    console.log(`[ExtractionPipeline] Document type: ${docType.documentType} (isResume=${docType.isResume}, confidence=${docType.confidence})`);

    if (!docType.isResume) {
      await Resume.findByIdAndUpdate(resumeId, {
        rawText,
        status: "NOT_A_RESUME",
        isResume: false,
        documentType: docType.documentType,
        processingError: `This document appears to be a "${docType.documentType}", not a resume. ${docType.reason}`,
      });
      console.warn(`[ExtractionPipeline] ✗ Not a resume — ${docType.documentType}. Aborting pipeline.`);
      return;
    }

    // Step 2: Groq structured extraction
    const structuredData = await extractStructuredData(rawText);
    console.log(`[ExtractionPipeline] Structured data extracted`);

    // Step 3: Compute section statuses
    const sectionStatuses = computeSectionStatuses(structuredData);

    // Step 4: Persist to DB
    await Resume.findByIdAndUpdate(resumeId, {
      rawText,
      isResume: true,
      documentType: "resume",
      structuredData: {
        personal: structuredData.personal || {},
        education: structuredData.education || [],
        experience: structuredData.experience || [],
        internships: structuredData.internships || [],
        skills: structuredData.skills || [],
        projects: structuredData.projects || [],
        certifications: structuredData.certifications || [],
        achievements: structuredData.achievements || [],
        publications: structuredData.publications || [],
        links: structuredData.links || [],
      },
      status: "READY",
    });

    console.log(`[ExtractionPipeline] ✓ Resume ${resumeId} is READY`);
  } catch (err: any) {
    await Resume.findByIdAndUpdate(resumeId, {
      status: "FAILED",
      processingError: err.message,
    });
    console.error(`[ExtractionPipeline] ✗ Failed: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/resume/:resumeId/status
// ─────────────────────────────────────────────────────────────────
export const getResumeStatus = asyncHandler(async (req: any, res: Response) => {
  const { resumeId } = req.params;
  const resume = await Resume.findById(resumeId).select(
    "status structuredData rawText fileName fileUrl processingError isResume documentType createdAt updatedAt"
  );

  if (!resume) {
    throw new AppError("Resume not found", 404);
  }

  const sectionStatuses = computeSectionStatuses(resume.structuredData as any);

  return sendSuccessResponse(res, {
    resumeId: resume._id,
    status: resume.status,
    isResume: (resume as any).isResume !== false, // default true for old records
    documentType: (resume as any).documentType || "resume",
    fileName: resume.fileName,
    fileUrl: resume.fileUrl,
    processingError: resume.processingError,
    structuredData: resume.structuredData,
    sectionStatuses,
    rawTextLength: resume.rawText?.length || 0,
    updatedAt: resume.updatedAt,
  });
});

// ─────────────────────────────────────────────────────────────────
// GET /api/resume/:resumeId/extraction
// Returns full extracted data for the Extraction Engine UI
// ─────────────────────────────────────────────────────────────────
export const getResumeExtraction = asyncHandler(async (req: any, res: Response) => {
  const { resumeId } = req.params;
  const resume = await Resume.findById(resumeId).select(
    "status structuredData rawText fileName createdAt"
  );

  if (!resume) {
    throw new AppError("Resume not found", 404);
  }

  const sectionStatuses = computeSectionStatuses(resume.structuredData as any);

  return sendSuccessResponse(res, {
    resumeId: resume._id,
    status: resume.status,
    fileName: resume.fileName,
    structuredData: resume.structuredData,
    sectionStatuses,
    extractedAt: resume.createdAt,
  });
});

// ─────────────────────────────────────────────────────────────────
// POST /api/resume/:resumeId/unlock
// ─────────────────────────────────────────────────────────────────
export const unlockResumePass = asyncHandler(async (req: any, res: Response) => {
  const { resumeId } = req.params;
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new AppError("Resume not found", 404);
  }

  // Set resume extraction to ready/active status
  resume.status = "READY";
  await resume.save();

  return sendSuccessResponse(
    res,
    { resumeId, status: "READY", unlocked: true },
    "Resume Intelligence pass unlocked successfully."
  );
});
