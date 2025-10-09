// src/main.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import { ShopRoute } from "./modules/shop/index.js";

// import productRoutes from "./modules/product/product.route.js";
// import authRoutes from "./modules/auth/auth.route.js";
// import searchRoutes from "./modules/search/search.route.js";
// import userRoutes from "./modules/user/user.route.js";
// import {
//   authMiddleware,
//   errorMiddleware,
//   loggerMiddleware,
// } from "./middlewares/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// app.use("/api/products", productRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/search", searchRoutes);
// app.use("/api/users", userRoutes);
app.use("/api/shops", ShopRoute);

// Connect MongoDB and start server
connectDB(process.env.MONGO_URI);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
