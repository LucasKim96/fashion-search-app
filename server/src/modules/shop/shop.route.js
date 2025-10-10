// Shop Routes
import express from "express";
import * as ShopController from "./shop.controller.js";

const router = express.Router();

router.get("/", ShopController.getShops); // GET all shops
router.get("/:id", ShopController.getShop); // GET shop by id
router.post("/", ShopController.addShop); // CREATE shop
router.put("/:id", ShopController.editShop); // UPDATE shop
router.delete("/:id", ShopController.removeShop); // DELETE shop

export default router;
