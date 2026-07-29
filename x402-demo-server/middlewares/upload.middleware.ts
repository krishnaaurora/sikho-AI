import { multerConfig } from "../config/multer.config";

export const uploadSingle = (fieldName: string) => multerConfig.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount: number = 10) =>
  multerConfig.array(fieldName, maxCount);
