// server/src/modules/cart/cart.service.js
import Cart from "./cart.model.js";

/**
 * 🔹 Lấy giỏ hàng theo accountId
 */
export const getCartByAccount = async (accountId) => {
  return await Cart.findOne({ accountId }).populate(
    "cartItems.productVariantId"
  );
};

/**
 * 🔹 Thêm sản phẩm vào giỏ hàng
 * - Nếu user chưa có cart → tạo mới
 * - Nếu sản phẩm đã có → tăng số lượng
 */
export const addToCart = async (accountId, productVariantId, quantity = 1) => {
  let cart = await Cart.findOne({ accountId });

  if (!cart) {
    // Tạo giỏ hàng mới nếu chưa có
    cart = new Cart({
      accountId,
      cartItems: [{ productVariantId, quantity }],
    });
  } else {
    // Kiểm tra sản phẩm đã có trong giỏ chưa
    const existingItem = cart.cartItems.find(
      (item) => item.productVariantId.toString() === productVariantId
    );

    if (existingItem) {
      existingItem.quantity += quantity; // tăng số lượng
    } else {
      cart.cartItems.push({ productVariantId, quantity });
    }
  }

  return await cart.save();
};

/**
 * 🔹 Cập nhật số lượng sản phẩm trong giỏ
 */
export const updateCartItem = async (accountId, productVariantId, quantity) => {
  const cart = await Cart.findOne({ accountId });
  if (!cart) throw new Error("Cart not found");

  const item = cart.cartItems.find(
    (item) => item.productVariantId.toString() === productVariantId
  );

  if (!item) throw new Error("Item not found in cart");

  item.quantity = quantity;
  return await cart.save();
};

/**
 * 🔹 Xóa sản phẩm khỏi giỏ hàng
 */
export const removeCartItem = async (accountId, productVariantId) => {
  const cart = await Cart.findOne({ accountId });
  if (!cart) throw new Error("Cart not found");

  cart.cartItems = cart.cartItems.filter(
    (item) => item.productVariantId.toString() !== productVariantId
  );

  return await cart.save();
};

/**
 * 🔹 Xóa toàn bộ giỏ hàng (vd: sau khi tạo order)
 */
export const clearCart = async (accountId) => {
  const cart = await Cart.findOne({ accountId });
  if (!cart) throw new Error("Cart not found");

  cart.cartItems = [];
  return await cart.save();
};
