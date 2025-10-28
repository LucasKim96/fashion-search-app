import { createUploader } from "../utils/index.js";
import path from "path";
// Không cần import process vì logic process.cwd() đã nằm trong createUploader

// Upload avatar user
export const uploadUserAvatar = createUploader({
  destinationGenerator: (req) => {
    // Trả về đường dẫn TƯƠNG ĐỐI từ thư mục GỐC (uploads/)
    return "avatars";
  },
  useAssets: false, // Mặc định là false (lưu vào uploads)
});

export const uploadDefautlAvatar = createUploader({
  destinationGenerator: (req) => {
    // Trả về đường dẫn TƯƠNG ĐỐI từ thư mục GỐC (uploads/)
    return "avatars";
  },
  useAssets: true, // Mặc định là false (lưu vào uploads)
});

// Upload avatar user
export const uploadAttribute = createUploader({
  destinationGenerator: (req) => {
    return "attributes";
  },
  useAssets: false, // Mặc định là false (lưu vào uploads)
});

export const uploadAttributeValueImages = createUploader({
  destinationGenerator: () => "attributes", // Lưu trong uploads/attributes
  useAssets: false,
}).any(); // nhận tất cả file, tương ứng với các fileKey khác nhau

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
