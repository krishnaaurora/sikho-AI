import express from "express";
import { chat, analyze, generateCourse } from "../controllers/ai";

const router = express.Router();

// AI Routes
router.post("/chat", chat);
router.post("/analyze", analyze);
router.post("/generate-course", generateCourse);

export default router;
