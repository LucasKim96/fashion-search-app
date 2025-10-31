// server/src/modules/cart/cart.controller.js
import * as CartService from "./cart.service.js";
import { apiResponse, ApiError } from "../../utils/index.js";

const { successResponse } = apiResponse;

// Lấy giỏ hàng
export const getCart = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");

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

// Thêm sản phẩm vào giỏ
export const addItem = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    const { productVariantId, quantity } = req.body;

    if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");
    if (!productVariantId || !quantity)
      throw ApiError.badRequest("Thiếu thông tin sản phẩm hoặc số lượng");

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

// Cập nhật số lượng
export const updateQuantity = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    const { productVariantId, quantity } = req.body;

    if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");
    if (!productVariantId || quantity === undefined)
      throw ApiError.badRequest("Thiếu thông tin sản phẩm hoặc số lượng");

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

// Xóa sản phẩm
export const removeItem = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    const { productVariantId } = req.params;

    if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");
    if (!productVariantId) throw ApiError.badRequest("Thiếu ID sản phẩm");

    const updatedCart = await CartService.removeFromCart(
      accountId,
      productVariantId
    );
    return successResponse(res, updatedCart, "Xóa sản phẩm thành công");
  } catch (error) {
    next(error);
  }
};

// Xóa toàn bộ giỏ
export const clearCart = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");

    const clearedCart = await CartService.clearCart(accountId);
    return successResponse(res, clearedCart, "Đã xóa toàn bộ giỏ hàng");
  } catch (error) {
    next(error);
  }
};

// Bulk add
export const bulkAdd = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    const { items } = req.body;

    if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");
    if (!items || !Array.isArray(items) || items.length === 0)
      throw ApiError.badRequest("Danh sách sản phẩm không hợp lệ");

    const updatedCart = await CartService.bulkAdd(accountId, items);
    return successResponse(res, updatedCart, "Đã thêm nhiều sản phẩm vào giỏ");
  } catch (error) {
    next(error);
  }
};

// Refresh cart
export const refreshCart = async (req, res, next) => {
  try {
    const accountId = req.user?.id;
    if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");

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
