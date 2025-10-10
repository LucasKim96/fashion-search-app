// server/src/modules/cart/cart.service.js
import CartModel from "./cart.model.js";

export const getCartByAccount = async (accountId) => {
  return await CartModel.findOne({ accountId }).populate(
    "cartItems.productVariantId"
  );
};

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

export const updateCart = async (id, data) => {
  return await CartModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteCart = async (id) => {
  return await CartModel.findByIdAndDelete(id);
};
