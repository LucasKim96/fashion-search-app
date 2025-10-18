// server/src/modules/cart/cart.service.js
import Cart from "./cart.model.js";
import mongoose from "mongoose";
import ApiError from "../../utils/apiError.js";
import ProductVariant from "../product/productVariant.model.js";
import Product from "../product/product.model.js";
import Shop from "../shop/shop.model.js";

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

/**
 * Lấy giỏ hàng với thông tin sản phẩm đầy đủ
 */
export const getCartWithDetails = async (accountId) => {
  if (!accountId) throw ApiError.badRequest("Thiếu accountId");

  const cart = await Cart.findOne({ accountId }).populate({
    path: "cartItems.productVariantId",
    populate: {
      path: "productId",
      populate: {
        path: "shopId",
        select: "shopName status",
      },
    },
  });

  if (!cart) {
    // Tạo giỏ hàng rỗng nếu chưa có
    const newCart = await Cart.create({ accountId, cartItems: [] });
    return newCart;
  }

  // Lọc bỏ các sản phẩm không tồn tại hoặc shop đã đóng
  const validItems = cart.cartItems.filter((item) => {
    const variant = item.productVariantId;
    if (!variant || !variant.productId) return false;

    const product = variant.productId;
    if (!product || !product.shopId) return false;

    const shop = product.shopId;
    return shop.status === "active";
  });

  // Cập nhật giỏ hàng nếu có sản phẩm không hợp lệ
  if (validItems.length !== cart.cartItems.length) {
    cart.cartItems = validItems;
    await cart.save();
  }

  return cart;
};

/**
 * Tính tổng tiền giỏ hàng
 */
export const calculateCartTotal = async (accountId) => {
  const cart = await getCartWithDetails(accountId);

  let total = 0;
  let itemCount = 0;

  cart.cartItems.forEach((item) => {
    if (item.productVariantId && item.productVariantId.price) {
      total += item.productVariantId.price * item.quantity;
      itemCount += item.quantity;
    }
  });

  return {
    total,
    itemCount,
    items: cart.cartItems.length,
  };
};

/**
 * Kiểm tra tồn kho sản phẩm
 */
export const checkStockAvailability = async (productVariantId, quantity) => {
  const variant = await ProductVariant.findById(productVariantId);
  if (!variant) {
    throw ApiError.notFound("Không tìm thấy sản phẩm");
  }

  if (variant.stock < quantity) {
    throw ApiError.badRequest(`Chỉ còn ${variant.stock} sản phẩm trong kho`);
  }

  return true;
};

/**
 * Cập nhật tồn kho sau khi đặt hàng
 */
export const updateStockAfterOrder = async (orderItems) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of orderItems) {
      await ProductVariant.findByIdAndUpdate(
        item.productVariantId,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
