import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    let destDir = "uploads/temp";
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
      destDir = "uploads/images";
    } else if ([".mp4", ".avi", ".mov"].includes(ext)) {
      destDir = "uploads/videos";
    } else if ([".pdf", ".doc", ".docx", ".txt"].includes(ext)) {
      destDir = "uploads/documents";
    }
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  cb(null, true);
};

export const multerConfig = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});
