import express from "express";
import { getStats, getTransactions, getUsers, addCourse, addLesson, createQuiz } from "../controllers/admin/admin.controller";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";

const router = express.Router();

// Secure all admin routes
router.use(authenticate, requireAdmin);

router.get("/stats", getStats);
router.get("/transactions", getTransactions);
router.get("/users", getUsers);
router.post("/courses", addCourse);
router.post("/lessons", addLesson);
router.post("/quizzes", createQuiz);

export default router;
