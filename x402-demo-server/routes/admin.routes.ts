import express from "express";
import {
  getOverview,
  getStats,
  getTransactions,
  getUsers,
  getUserDetails,
  toggleUserStatus,
  getAppAnalytics,
  getActivityLogs,
  createActivityLog,
  exportCsv,
  addCourse,
  addLesson,
  createQuiz,
} from "../controllers/admin/admin.controller";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";

const router = express.Router();

// Secure all admin routes
router.use(authenticate, requireAdmin);

router.get("/overview", getOverview);
router.get("/stats", getStats);
router.get("/transactions", getTransactions);
router.get("/payments", getTransactions);
router.get("/users", getUsers);
router.get("/users/:userId/details", getUserDetails);
router.patch("/users/:userId/status", toggleUserStatus);
router.get("/app-analytics", getAppAnalytics);
router.get("/activity-logs", getActivityLogs);
router.post("/activity-logs", createActivityLog);
router.get("/export-csv", exportCsv);

router.post("/courses", addCourse);
router.post("/lessons", addLesson);
router.post("/quizzes", createQuiz);

export default router;
