// server/src/modules/cart/cart.service.js
import Cart from "./cart.model.js";
import mongoose from "mongoose";
import ApiError from "../../utils/apiError.js";
import ProductVariant from "../product/productVariant.model.js";
import Product from "../product/product.model.js";
import Shop from "../shop/shop.model.js";

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
    throw ApiError.badRequest("ID sản phẩm không hợp lệ");

  if (quantity <= 0) throw ApiError.badRequest("Số lượng phải lớn hơn 0");

  // Kiểm tra trạng thái shop của product variant
  const variant = await ProductVariant.findById(productVariantId);
  if (!variant) throw ApiError.notFound("Không tìm thấy biến thể sản phẩm");

  const product = await Product.findById(variant.productId);
  if (!product) throw ApiError.notFound("Không tìm thấy sản phẩm");

  const shop = await Shop.findById(product.shopId);
  if (!shop) throw ApiError.notFound("Không tìm thấy shop của sản phẩm");

  if (shop.status === "closed") {
    throw ApiError.forbidden("Shop đang đóng, không thể thêm vào giỏ hàng");
  }

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

/**
 * Xóa sản phẩm của shop đã bị xóa khỏi tất cả giỏ hàng
 */
export const removeProductsFromAllCarts = async (productIds) => {
  if (!productIds || productIds.length === 0) return;

  // Tìm tất cả product variants của các sản phẩm bị xóa
  const variants = await ProductVariant.find(
    { productId: { $in: productIds } },
    { _id: 1 }
  );
  const variantIds = variants.map((v) => v._id);

  if (variantIds.length === 0) return;

  // Xóa khỏi tất cả giỏ hàng
  await Cart.updateMany(
    {},
    { $pull: { cartItems: { productVariantId: { $in: variantIds } } } }
  );
};
