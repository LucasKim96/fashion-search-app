// src/main.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";
import {
  AccountRoutes,
  AuthRoutes,
  UserInfoRoutes,
  ShopRoutes,
  CartRoutes,
  OrderRoutes,
} from "./modules/index.js"; // import cho mongodb
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

// Config
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Lấy đường dẫn tuyệt đối
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.cwd();

// Middleware
app.use(cors());
app.use(express.json());

// Static folder
app.use("/assets", express.static(path.join(ROOT_DIR, "assets")));
app.use("/uploads", express.static(path.join(ROOT_DIR, "uploads")));

// Routes
app.use("/api/accounts", AccountRoutes);
app.use("/api/auth", AuthRoutes);
app.use("/api/users", UserInfoRoutes);
app.use("/api/shops", ShopRoutes);
app.use("/api/carts", CartRoutes);
app.use("/api/orders", OrderRoutes);

// 404 handler - phải đặt trước errorHandler
app.use(notFoundHandler);

// Error handling middleware (phải đặt cuối cùng)
app.use(errorHandler);
// Connect MongoDB and start server
connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

export default app;
