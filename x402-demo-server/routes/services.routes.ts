import express, { Response, NextFunction } from "express";
import {
  getRegistry,
  getServiceDetails,
  orchestrateCodeReview,
  getTransactionHistory,
  getTransactionById,
} from "../controllers/serviceOrchestrator.controller";
import { verifyAccessToken, getUserById } from "../services/auth";

const router = express.Router();

// Optional authentication helper
const optionalAuth = async (req: any, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded: any = verifyAccessToken(token);
      const currentUser = await getUserById(decoded.userId);
      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
        return next();
      }
    }
    next();
  } catch (err) {
    next();
  }
};

router.get("/registry", getRegistry);
router.get("/registry/:serviceId", getServiceDetails);
router.post("/code-review/orchestrate", optionalAuth, orchestrateCodeReview);
router.get("/transactions", optionalAuth, getTransactionHistory);
router.get("/transactions/:id", getTransactionById);

export default router;
