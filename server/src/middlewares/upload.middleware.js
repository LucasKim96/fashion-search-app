import { createUploader } from "../utils/index.js";
import path from "path";
import process from "process";

// 🧩 Upload avatar user
export const uploadUserAvatar = createUploader({
  destinationGenerator: (req) =>
    path.join(process.cwd(), "uploads", "users", req.user?.id || "unknown"),
});

// 🧩 Upload image shop
export const uploadShopImage = createUploader({
  destinationGenerator: (req) =>
    path.join(process.cwd(), "uploads", "shops", req.params?.id || "temp"),
});
