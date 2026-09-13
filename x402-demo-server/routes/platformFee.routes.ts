import express from "express";
import { handlePlatformFee } from "../controllers/platformFee.controller";

const router = express.Router();

// POST /api/v1/payments/platform-fee
router.post("/platform-fee", handlePlatformFee);

export default router;
