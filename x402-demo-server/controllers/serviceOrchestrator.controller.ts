import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccessResponse } from "../utils/response";
import { getAllServices, getServiceById } from "../services/serviceRegistry";
import { executeServiceOrchestration } from "../services/serviceOrchestrator.service";
import ServiceTransaction from "../models/ServiceTransaction.model";

export const getRegistry = asyncHandler(async (req: Request, res: Response) => {
  const services = getAllServices();
  sendSuccessResponse(res, services, "Service registry retrieved successfully");
});

export const getServiceDetails = asyncHandler(async (req: Request, res: Response) => {
  const { serviceId } = req.params;
  const service = getServiceById(serviceId);
  if (!service) {
    return res.status(404).json({ success: false, message: "Service not found" });
  }
  sendSuccessResponse(res, service, "Service details retrieved successfully");
});

export const orchestrateCodeReview = asyncHandler(async (req: any, res: Response) => {
  const { serviceId = "prism-code-review", payload, userPaymentTxId } = req.body;
  const userId = req.user?._id?.toString() || req.body.userId || "user_guest";

  if (!payload || (!payload.code && !payload.raw_url)) {
    return res.status(400).json({
      success: false,
      message: "Please provide either a GitHub raw file URL or code content for analysis.",
    });
  }

  const result = await executeServiceOrchestration({
    serviceId,
    userId,
    userPaymentTxId,
    payload,
  });

  sendSuccessResponse(
    res,
    result,
    "Senior code review orchestrated and verified successfully",
    200
  );
});

export const getTransactionHistory = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?._id?.toString() || req.query.userId;
  const query: any = {};
  if (userId) query.userId = userId;

  const transactions = await ServiceTransaction.find(query).sort({ createdAt: -1 });
  sendSuccessResponse(res, transactions, "Service transactions retrieved successfully");
});

export const getTransactionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const transaction = await ServiceTransaction.findOne({
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }],
  });

  if (!transaction) {
    return res.status(404).json({ success: false, message: "Transaction not found" });
  }

  sendSuccessResponse(res, transaction, "Transaction details retrieved successfully");
});
