// server/src/middlewares/upload.middleware.js

import { createUploader } from "../utils/index.js";
import path from "path";
// Không cần import process vì logic process.cwd() đã nằm trong createUploader

// 🧩 Upload avatar user
export const uploadUserAvatar = createUploader({
  destinationGenerator: (req) => {
    // Trả về đường dẫn TƯƠNG ĐỐI từ thư mục GỐC (uploads/)
    // Lấy ID từ req.user (đã qua authMiddleware)
    return path.join("users", req.user?.id || "unknown");
  },
  useAssets: false, // Mặc định là false (lưu vào uploads)
});

// 🧩 Upload image shop
export const uploadShopImage = createUploader({
  destinationGenerator: (req) => {
    // 🚨 KHÔNG CẦN TẠO THƯ MỤC CON, CHỈ CẦN DÙNG SHOP ID
    // Path: uploads/shops/:id/
    return path.join("shops", req.params.id);
  },
  useAssets: false,
});

// server/src/middlewares/upload.middleware.js

// ... (các middleware khác)

export const uploadShopDefaultImage = createUploader({
  destinationGenerator: (req) => {
    return "shop";
  },
  useAssets: true, // Vẫn giữ nguyên là TRUE để lưu vào src/assets
});
