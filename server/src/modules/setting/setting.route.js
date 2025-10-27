import express from "express";
import {
  getSettingController,
  updateSettingController,
} from "./setting.controller.js";

const router = express.Router();

// GET /api/settings
router.get("/", getSettingController);

// PUT /api/settings
router.put("/", updateSettingController);

export default router;
