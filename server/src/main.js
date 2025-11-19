// src/main.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
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
  AttributeRoutes,
  AttributeValueRoutes,
  ProductRoutes,
  ProductVariantRoutes,
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
// app.use(cors());
const allowedOrigins = [
  "http://localhost:3000", // FE client
  "http://localhost:3001", // FE admin
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Cho phép request không có origin (vd: Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // nếu dùng cookie/token trong header
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// Static folder
app.use(
  "/uploads",
  cors({ origin: ["http://localhost:3000", "http://localhost:3001"] }),
  express.static(path.join(ROOT_DIR, "uploads"))
);

app.use(
  "/assets",
  cors({ origin: ["http://localhost:3000", "http://localhost:3001"] }),
  express.static(path.join(ROOT_DIR, "assets"))
);

// Routes
app.use("/api/accounts", AccountRoutes);
app.use("/api/auth", AuthRoutes);
app.use("/api/users", UserInfoRoutes);
app.use("/api/shops", ShopRoutes);
app.use("/api/carts", CartRoutes);
app.use("/api/orders", OrderRoutes);
app.use("/api/attributes", AttributeRoutes);
app.use("/api/attribute-values", AttributeValueRoutes);
app.use("/api/products", ProductRoutes);
app.use("/api/product-variants", ProductVariantRoutes);

// 404 handler - phải đặt trước errorHandler
app.use(notFoundHandler);

// Error handling middleware (phải đặt cuối cùng)
app.use(errorHandler);

// Connect MongoDB and start server
connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, async () => {
      console.log(`🚀 Server running on port ${PORT}`);

      // ✅ Import và khởi động cron job tại đây
      const { default: startAutoTransitionJob } = await import("./jobs/autoTransition.job.js");
      startAutoTransitionJob();
      console.log("🔄 Auto transition job started");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

export default app;
