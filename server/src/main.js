// src/main.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";
import "./modules/index.js"; // import cho mongodb

import authRoutes from "./modules/auth/auth.route.js";

import { ShopRoutes } from "./modules/shop/index.js";
// import { CartRoutes } from "./modules/cart/index.js";

// Config
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Lấy đường dẫn tuyệt đối
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Static folder
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes

// app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
// app.use("/api/search", searchRoutes);
// app.use("/api/users", userRoutes);
app.use("/api/shops", ShopRoutes);

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
