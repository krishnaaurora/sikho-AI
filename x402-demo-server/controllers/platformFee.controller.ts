import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccessResponse } from "../utils/response";
import { processPlatformFee } from "../services/platformFee.service";

export const handlePlatformFee = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      reviewId,
      fileId,
      filePath,
      amount,
      currency,
      assetId,
      network,
      purpose,
    } = req.body;

    if (!reviewId || !fileId) {
      return res.status(400).json({
        success: false,
        message: "reviewId and fileId are required fields.",
      });
    }

    const result = await processPlatformFee({
      reviewId,
      fileId,
      filePath,
      amount: amount ? Number(amount) : undefined,
      currency,
      assetId,
      network,
      purpose,
    });

    sendSuccessResponse(
      res,
      result,
      "Sikho platform fee processed and ledgered successfully",
      200
    );
  }
);
