import express from "express";
import authRoutes from "./auth.routes";
import learnerRoutes from "./learner.routes";
import adminRoutes from "./admin.routes";
import courseRoutes from "./course.routes";
import lessonRoutes from "./lesson.routes";
import paymentRoutes from "./payment.routes";
import walletRoutes from "./wallet.routes";
import aiRoutes from "./ai.routes";
import analyticsRoutes from "./analytics.routes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/learners", learnerRoutes);
router.use("/admin", adminRoutes);
router.use("/courses", courseRoutes);
router.use("/lessons", lessonRoutes);
router.use("/payments", paymentRoutes);
router.use("/wallets", walletRoutes);
router.use("/ai", aiRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
