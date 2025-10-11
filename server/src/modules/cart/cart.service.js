// server/src/modules/cart/cart.service.js
import Cart from "./cart.model.js";
import mongoose from "mongoose";

/**
 * Lấy giỏ hàng của 1 người dùng
 */
export const getCartByAccount = async (accountId) => {
  if (!accountId) throw new Error("Thiếu accountId hợp lệ");

  const cart = await Cart.findOneAndUpdate(
    { accountId },
    { $setOnInsert: { cartItems: [] } },
    { new: true, upsert: true }
  ).populate("cartItems.productVariantId");

  return cart;
};

/**
 * Thêm sản phẩm vào giỏ
 */
export const addToCart = async (accountId, productVariantId, quantity = 1) => {
  if (!mongoose.Types.ObjectId.isValid(productVariantId))
    throw new Error("ID sản phẩm không hợp lệ");

  if (quantity <= 0) throw new Error("Số lượng phải lớn hơn 0");

  // Tìm cart của user
  let cart = await Cart.findOne({ accountId });

  // Nếu chưa có → tạo rỗng
  if (!cart) {
    cart = await Cart.create({ accountId, cartItems: [] });
  }

  // Tìm sản phẩm trong giỏ hàng
  const existingItem = cart.cartItems.find(
    (item) => item.productVariantId.toString() === String(productVariantId)
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.cartItems.push({ productVariantId, quantity });
  }

  await cart.save();

  return await cart.populate("cartItems.productVariantId");
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ
 */
export const updateItemQuantity = async (
  accountId,
  productVariantId,
  quantity
) => {
  const cart = await Cart.findOne({ accountId });
  if (!cart) throw new Error("Không tìm thấy giỏ hàng");

  const item = cart.cartItems.find(
    (i) => i.productVariantId.toString() === productVariantId
  );
  if (!item) throw new Error("Sản phẩm không có trong giỏ hàng");

  item.quantity = quantity;
  await cart.save();

  return await cart.populate("cartItems.productVariantId");
};

/**
 * Xóa 1 sản phẩm khỏi giỏ hàng
 */
export const removeFromCart = async (accountId, productVariantId) => {
  const cart = await Cart.findOne({ accountId });
  if (!cart) throw new Error("Không tìm thấy giỏ hàng");

  cart.cartItems = cart.cartItems.filter(
    (i) => i.productVariantId.toString() !== productVariantId
  );

  await cart.save();
  return await cart.populate("cartItems.productVariantId");
};

/**
 * Xóa toàn bộ giỏ hàng
 */
export const clearCart = async (accountId) => {
  const cart = await Cart.findOneAndUpdate(
    { accountId },
    { cartItems: [] },
    { new: true }
  );
  return cart;
};
