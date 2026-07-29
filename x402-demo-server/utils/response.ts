import { Response } from "express";

export const sendSuccessResponse = (
  res: Response,
  data: any = null,
  message: string = "Success",
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const sendErrorResponse = (
  res: Response,
  error: any,
  message: string = "Error",
  statusCode: number = 500
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
    timestamp: new Date().toISOString(),
  });
}