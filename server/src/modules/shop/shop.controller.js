// server/src/modules/shop/shop.controller.js
import * as ShopService from "./shop.service.js";
import { successResponse, errorResponse } from "../../utils/index.js";

export const getShops = async (req, res) => {
  try {
    const shops = await ShopService.getAllShops();
    successResponse(
      res,
      shops,
      shops.length ? "Fetched shops successfully" : "No shops found"
    );
  } catch (err) {
    errorResponse(res, err);
  }
};

export const getShop = async (req, res) => {
  try {
    const shop = await ShopService.getShopById(req.params.id);
    if (!shop) return errorResponse(res, "Shop not found", 404);
    successResponse(res, shop, "Fetched shop successfully");
  } catch (err) {
    errorResponse(res, err);
  }
};

export const addShop = async (req, res) => {
  try {
    const shop = await ShopService.createShop(req.body);
    successResponse(res, shop, "Shop created successfully", 201);
  } catch (err) {
    errorResponse(res, err);
  }
};

export const editShop = async (req, res) => {
  try {
    const shop = await ShopService.updateShop(req.params.id, req.body);
    if (!shop) return errorResponse(res, "Shop not found", 404);
    successResponse(res, shop, "Shop updated successfully");
  } catch (err) {
    errorResponse(res, err);
  }
};

export const removeShop = async (req, res) => {
  try {
    const shop = await ShopService.deleteShop(req.params.id);
    if (!shop) return errorResponse(res, "Shop not found", 404);
    successResponse(res, null, "Shop deleted successfully");
  } catch (err) {
    errorResponse(res, err);
  }
};
