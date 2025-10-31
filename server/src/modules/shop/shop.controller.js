// server/src/modules/cart/cart.controller.js
import * as CartService from "./cart.service.js";
import { apiResponse } from "../../utils/index.js";

const { successResponse } = apiResponse;

/**
 * 🛒 Lấy giỏ hàng
 */
export const getCart = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    const cart = await CartService.getCartWithDetails(accountId);
    const total = await CartService.calculateCartTotal(accountId);

    return successResponse(
      res,
      { cart, summary: total },
      "Lấy giỏ hàng thành công"
    );
  } catch (error) {
    next(error);
  }
};

/**
 * ➕ Thêm sản phẩm vào giỏ
 */
export const addItem = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
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
    next(error);
  }
};

/**
 * 🔢 Cập nhật số lượng sản phẩm
 */
export const updateQuantity = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    const { productVariantId, quantity } = req.body;

    const updatedCart = await CartService.updateItemQuantity(
      accountId,
      productVariantId,
      quantity
    );

    return successResponse(res, updatedCart, "Cập nhật số lượng thành công");
  } catch (error) {
    next(error);
  }
};

/**
 * ❌ Xóa 1 sản phẩm khỏi giỏ
 */
export const removeItem = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    const { productVariantId } = req.params;

    const updatedCart = await CartService.removeFromCart(
      accountId,
      productVariantId
    );

    return successResponse(res, updatedCart, "Xóa sản phẩm thành công");
  } catch (error) {
    next(error);
  }
};

/**
 * 🧹 Xóa toàn bộ giỏ hàng
 */
export const clearCart = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    const clearedCart = await CartService.clearCart(accountId);
    return successResponse(res, clearedCart, "Đã xóa toàn bộ giỏ hàng");
  } catch (error) {
    next(error);
  }
};

/**
 * 🧺 Thêm nhiều sản phẩm (bulk add)
 */
export const bulkAdd = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    const { items } = req.body;

    const updatedCart = await CartService.bulkAdd(accountId, items);
    return successResponse(res, updatedCart, "Đã thêm nhiều sản phẩm vào giỏ");
  } catch (error) {
    next(error);
  }
};

/**
 * 🔄 Làm mới giỏ hàng (đồng bộ giá, tồn kho, trạng thái)
 */
export const refreshCart = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    const refreshedCart = await CartService.refreshCart(accountId);
    return successResponse(
      res,
      refreshedCart,
      "Đã đồng bộ lại giỏ hàng thành công"
    );
  } catch (error) {
    next(error);
  }
};
