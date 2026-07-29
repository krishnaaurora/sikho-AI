import express from "express";
import { getOverview } from "../controllers/analytics/analytics.controller";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";

const router = express.Router();

// Secure all analytics routes
router.use(authenticate, requireAdmin);

router.get("/overview", getOverview);

export default router;
