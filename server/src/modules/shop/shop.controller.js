// Shop Controller
import * as ShopService from "./shop.service.js";

export const getShops = async (req, res) => {
  try {
    const shops = await ShopService.getAllShops();
    res.status(200).json({
      success: true,
      message: shops.length ? "Fetched shops successfully" : "No shops found",
      data: shops,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
      data: null,
    });
  }
};

export const getShop = async (req, res) => {
  try {
    const shop = await ShopService.getShopById(req.params.id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
        data: null,
      });
    }
    res.status(200).json({
      success: true,
      message: "Fetched shop successfully",
      data: shop,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
      data: null,
    });
  }
};

export const addShop = async (req, res) => {
  try {
    const shop = await ShopService.createShop(req.body);
    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      data: shop,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
      data: null,
    });
  }
};

export const editShop = async (req, res) => {
  try {
    const shop = await ShopService.updateShop(req.params.id, req.body);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
        data: null,
      });
    }
    res.status(200).json({
      success: true,
      message: "Shop updated successfully",
      data: shop,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
      data: null,
    });
  }
};

export const removeShop = async (req, res) => {
  try {
    const shop = await ShopService.deleteShop(req.params.id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
        data: null,
      });
    }
    res.status(200).json({
      success: true,
      message: "Shop deleted successfully",
      data: null,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
      data: null,
    });
  }
};
