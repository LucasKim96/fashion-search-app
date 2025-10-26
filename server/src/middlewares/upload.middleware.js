import multer from "multer";
import path from "path";
import fs from "fs";

export const uploadFiles = (folderName) => {
  const uploadPath = path.join("server", "src", "uploads", folderName);

  if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

  const storage = multer.memoryStorage();
  return multer({ storage });
};
