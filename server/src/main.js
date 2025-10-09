// src/main.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import { ShopRoutes } from "./modules/shop/index.js";

// Config
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/shops", ShopRoutes);

// Connect MongoDB and start server
connectDB(process.env.MONGO_URI);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
