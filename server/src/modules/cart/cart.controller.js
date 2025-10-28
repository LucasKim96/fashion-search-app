// server/src/modules/cart/cart.controller.js
import * as CartService from "./cart.service.js";
import { apiResponse } from "../../utils/index.js";
import ApiError from "../../utils/apiError.js";

const { successResponse, errorResponse } = apiResponse;

/**
 * Lấy giỏ hàng
 */
export const getCart = async (req, res) => {
  try {
    const accountId = req.user?.id || req.body.accountId;

    if (!accountId) {
      return errorResponse(res, "Chưa đăng nhập", 401);
    }

    const cart = await CartService.getCartWithDetails(accountId);
    const total = await CartService.calculateCartTotal(accountId);

    return successResponse(
      res,
      {
        cart,
        summary: total,
      },
      "Lấy giỏ hàng thành công"
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Thêm sản phẩm vào giỏ
 */
export const addItem = async (req, res) => {
  try {
    const accountId = req.user?.id || req.body.accountId;
    const { productVariantId, quantity } = req.body;

    if (!accountId) {
      return errorResponse(res, "Chưa đăng nhập", 401);
    }

    if (!productVariantId || !quantity) {
      return errorResponse(res, "Thiếu thông tin sản phẩm hoặc số lượng", 400);
    }

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
    throw error;
  }
};

/**
 * Cập nhật số lượng
 */
export const updateQuantity = async (req, res) => {
  try {
    const accountId = req.user?.id || req.body.accountId;
    const { productVariantId, quantity } = req.body;

    if (!accountId) {
      return errorResponse(res, "Chưa đăng nhập", 401);
    }

    if (!productVariantId || quantity === undefined) {
      return errorResponse(res, "Thiếu thông tin sản phẩm hoặc số lượng", 400);
    }

    const updatedCart = await CartService.updateItemQuantity(
      accountId,
      productVariantId,
      quantity
    );

    return successResponse(res, updatedCart, "Cập nhật số lượng thành công");
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa sản phẩm
 */
export const removeItem = async (req, res) => {
  try {
    const accountId = req.user?.id || req.body.accountId;
    const { productVariantId } = req.params;

    if (!accountId) {
      return errorResponse(res, "Chưa đăng nhập", 401);
    }

    if (!productVariantId) {
      return errorResponse(res, "Thiếu ID sản phẩm", 400);
    }

    const updatedCart = await CartService.removeFromCart(
      accountId,
      productVariantId
    );

    return successResponse(res, updatedCart, "Xóa sản phẩm thành công");
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa toàn bộ giỏ hàng
 */
export const clearCart = async (req, res) => {
  try {
    const accountId = req.user?.id || req.body.accountId;

    if (!accountId) {
      return errorResponse(res, "Chưa đăng nhập", 401);
    }

    const clearedCart = await CartService.clearCart(accountId);

    return successResponse(res, clearedCart, "Đã xóa toàn bộ giỏ hàng");
  } catch (error) {
    throw error;
  }
};
