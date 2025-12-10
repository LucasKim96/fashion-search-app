import express from "express";
import { uploadDisk } from "../../middlewares/upload.middleware.js"; // Middleware upload multer của bạn
import { detectObjects, searchImage, searchText } from "./index.js";

const router = express.Router();

// Upload 1 ảnh vào thư mục temp để xử lý
router.post("/detect", uploadDisk.single("image"), detectObjects);
router.post("/search-image", uploadDisk.single("image"), searchImage);

router.get("/text", searchText);

export default router;
