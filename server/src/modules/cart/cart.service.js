// server/src/modules/cart/cart.service.js
import Cart from "./cart.model.js";
import ProductVariant from "../product/index.js";

/**
 * Lấy giỏ hàng của 1 người dùng
 */
export const getCartByAccount = async (accountId) => {
  let cart = await Cart.findOne({ accountId })
    .populate("cartItems.productVariantId")
    .lean();

  // Nếu chưa có giỏ hàng thì tạo rỗng
  if (!cart) {
    cart = await Cart.create({ accountId, cartItems: [] });
  }

  return cart;
};

/**
 * Thêm sản phẩm vào giỏ
 */
export const addToCart = async (accountId, productVariantId, quantity = 1) => {
  let cart = await Cart.findOne({ accountId });

  if (!cart) {
    cart = new Cart({ accountId, cartItems: [] });
  }

  const existingItem = cart.cartItems.find(
    (item) => item.productVariantId.toString() === productVariantId
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
