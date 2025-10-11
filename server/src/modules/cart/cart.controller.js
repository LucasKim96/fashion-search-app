// server/src/modules/cart/cart.controller.js
import * as CartService from "./cart.service.js";
import { apiResponse } from "../../utils/index.js";

const { successResponse, errorResponse } = apiResponse;

/**
 * Lấy giỏ hàng
 */
export const getCart = async (req, res) => {
  try {
    const accountId = req.user?._id || req.body.accountId;
    const cart = await CartService.getCartByAccount(accountId);
    return successResponse(res, cart, "Lấy giỏ hàng thành công");
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Thêm sản phẩm vào giỏ
 */
export const addItem = async (req, res) => {
  try {
    const accountId = req.user?._id || req.body.accountId;
    const { productVariantId, quantity } = req.body;
    const updatedCart = await CartService.addToCart(
      accountId,
      productVariantId,
      quantity
    );
    return successResponse(
      res,
      updatedCart,
      "Thêm sản phẩm vào giỏ thành công"
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Cập nhật số lượng
 */
export const updateQuantity = async (req, res) => {
  try {
    const accountId = req.user?._id || req.body.accountId;
    const { productVariantId, quantity } = req.body;
    const updatedCart = await CartService.updateItemQuantity(
      accountId,
      productVariantId,
      quantity
    );
    return successResponse(res, updatedCart, "Cập nhật số lượng thành công");
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Xóa sản phẩm
 */
export const removeItem = async (req, res) => {
  try {
    const accountId = req.user?._id || req.body.accountId;
    const { productVariantId } = req.params;
    const updatedCart = await CartService.removeFromCart(
      accountId,
      productVariantId
    );
    return successResponse(res, updatedCart, "Xóa sản phẩm thành công");
  } catch (error) {
    return errorResponse(res, error);
  }
};

/**
 * Xóa toàn bộ giỏ hàng
 */
export const clearCart = async (req, res) => {
  try {
    const accountId = req.user?._id || req.body.accountId;
    const clearedCart = await CartService.clearCart(accountId);
    return successResponse(res, clearedCart, "Đã xóa toàn bộ giỏ hàng");
  } catch (error) {
    return errorResponse(res, error);
  }
};
