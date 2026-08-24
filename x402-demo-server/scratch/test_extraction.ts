import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { extractRawText, extractStructuredData } from "../services/resumeExtraction.service";
import { analyzeResumeQuality } from "../services/resumeQuality.service";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function testExtractionAndQuality() {
  // Connect to DB
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-education-platform";
  console.log("Connecting to MongoDB:", uri);
  await mongoose.connect(uri);
  console.log("Connected!");

  const pdfPath = path.join(__dirname, "../uploads/documents/1787158857357-498283241.pdf");
  console.log("Extracting raw text from:", pdfPath);
  try {
    const rawText = await extractRawText(pdfPath);
    console.log("Raw text length:", rawText.length);

    console.log("\nExtracting structured data via Groq...");
    const structured = await extractStructuredData(rawText);
    
    console.log("\nRunning ATS and Quality Analysis via Groq...");
    const qualityReport = await analyzeResumeQuality(rawText, structured);
    console.log("Quality Report:\n", JSON.stringify(qualityReport, null, 2));

  } catch (err: any) {
    console.error("Pipeline error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

testExtractionAndQuality();
