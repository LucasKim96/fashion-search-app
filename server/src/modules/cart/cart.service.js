import Cart from "./cart.model.js";
import { ApiError, validateObjectId } from "../../utils/index.js";
import { withTransaction } from "../../utils/index.js";
import { Product, ProductVariant } from "../product/index.js";
import { Shop } from "../shop/index.js";

/**
 * Thêm sản phẩm vào giỏ hàng
 */
export const addToCart = async (accountId, productVariantId, quantity = 1) => {
  validateObjectId(productVariantId, "ID sản phẩm");
  if (quantity <= 0) throw ApiError.badRequest("Số lượng phải lớn hơn 0");

  return await withTransaction(async (session) => {
    const variant = await ProductVariant.findById(productVariantId)
      .populate("productId")
      .session(session);
    if (!variant) throw ApiError.notFound("Không tìm thấy sản phẩm variant");

    const product = variant.productId;
    if (!product) throw ApiError.notFound("Không tìm thấy sản phẩm");

    const shop = await Shop.findById(product.shopId).session(session);
    if (!shop) throw ApiError.notFound("Không tìm thấy shop của sản phẩm");

    // 🧮 Tính giá hiện tại
    const priceAtAdd =
      (product.basePrice || 0) + (variant.priceAdjustment || 0);

    let cart = await Cart.findOne({ accountId }).session(session);
    if (!cart)
      cart = await Cart.create([{ accountId, cartItems: [] }], {
        session,
      }).then(([c]) => c);

    const existingItem = cart.cartItems.find(
      (item) => item.productVariantId.toString() === String(productVariantId)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.priceAtAdd = priceAtAdd;
      existingItem.imageAtAdd = variant.image || product.thumbnail;
      existingItem.pdNameAtAdd = product.productName;
      existingItem.attributes = variant.attributes || [];
    } else {
      cart.cartItems.push({
        productId: product._id,
        productVariantId: variant._id,
        quantity,
        priceAtAdd, // ✅ dùng giá đã tính
        imageAtAdd: variant.image || product.thumbnail,
        pdNameAtAdd: product.productName,
        attributes: variant.attributes || [],
      });
    }

    await cart.save({ session });
    return await cart.populate("cartItems.productVariantId");
  });
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ
 */
export const updateItemQuantity = async (
  accountId,
  productVariantId,
  quantity
) => {
  validateObjectId(productVariantId, "ID sản phẩm");

  const cart = await Cart.findOne({ accountId });
  if (!cart) throw ApiError.notFound("Không tìm thấy giỏ hàng");

  const item = cart.cartItems.find(
    (i) => i.productVariantId.toString() === String(productVariantId)
  );
  if (!item) throw ApiError.notFound("Sản phẩm không có trong giỏ hàng");

  if (quantity <= 0) {
    cart.cartItems = cart.cartItems.filter(
      (i) => i.productVariantId.toString() !== String(productVariantId)
    );
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  return await cart.populate("cartItems.productVariantId");
};

/**
 * Xóa 1 sản phẩm khỏi giỏ hàng
 */
export const removeFromCart = async (accountId, productVariantId) => {
  validateObjectId(productVariantId, "ID sản phẩm");

  const cart = await Cart.findOne({ accountId });
  if (!cart) throw ApiError.notFound("Không tìm thấy giỏ hàng");

  const before = cart.cartItems.length;
  cart.cartItems = cart.cartItems.filter(
    (i) => i.productVariantId.toString() !== String(productVariantId)
  );
  if (cart.cartItems.length === before)
    throw ApiError.notFound("Sản phẩm không tồn tại trong giỏ hàng");

  await cart.save();
  return await cart.populate("cartItems.productVariantId");
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
 * Xóa toàn bộ giỏ hàng
 */
export const clearCart = async (accountId) => {
  const cart = await Cart.findOneAndUpdate(
    { accountId },
    { cartItems: [] },
    { new: true }
  );
  if (!cart) throw ApiError.notFound("Không tìm thấy giỏ hàng");
  return cart;
};

/**
 * Lấy giỏ hàng chi tiết (kèm sản phẩm, shop, trạng thái)
 */
export const getCartWithDetails = async (accountId) => {
  if (!accountId) throw ApiError.badRequest("Thiếu accountId");

  let cart = await Cart.findOne({ accountId }).populate({
    path: "cartItems.productVariantId",
    populate: {
      path: "productId",
      populate: { path: "shopId", select: "shopName status" },
    },
  });

  if (!cart) return await Cart.create({ accountId, cartItems: [] });

  const validItems = cart.cartItems.filter((item) => {
    const variant = item.productVariantId;
    const product = variant?.productId;
    const shop = product?.shopId;
    return variant && product && shop && shop.status === "active";
  });

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

  const summary = cart.cartItems.reduce(
    (acc, item) => {
      const price = item.productVariantId?.price || item.priceAtAdd || 0;
      acc.total += price * item.quantity;
      acc.itemCount += item.quantity;
      return acc;
    },
    { total: 0, itemCount: 0 }
  );

  return { ...summary, items: cart.cartItems.length };
};

/**
 * Thêm nhiều sản phẩm vào giỏ (bulk)
 */
export const bulkAdd = async (accountId, items) => {
  if (!Array.isArray(items) || items.length === 0)
    throw ApiError.badRequest("Danh sách sản phẩm không hợp lệ");

  return await withTransaction(async (session) => {
    let cart = await Cart.findOne({ accountId }).session(session);
    if (!cart)
      cart = await Cart.create([{ accountId, cartItems: [] }], {
        session,
      }).then(([c]) => c);

    for (const { productVariantId, quantity } of items) {
      validateObjectId(productVariantId, "ID sản phẩm");
      if (quantity <= 0) continue;

      const variant = await ProductVariant.findById(productVariantId)
        .populate("productId")
        .session(session);
      if (!variant || !variant.productId) continue;

      const existingItem = cart.cartItems.find(
        (item) => item.productVariantId.toString() === String(productVariantId)
      );

      if (existingItem) existingItem.quantity += quantity;
      else {
        cart.cartItems.push({
          productId: variant.productId._id,
          productVariantId: variant._id,
          quantity,
          priceAtAdd: variant.price,
          imageAtAdd: variant.image || variant.productId.thumbnail,
          pdNameAtAdd: variant.productId.productName,
          attributes: variant.attributes || [],
        });
      }
    }

    await cart.save({ session });
    return await cart.populate("cartItems.productVariantId");
  });
};

/**
 * Làm mới giỏ hàng (đồng bộ giá, tồn kho, trạng thái)
 */
export const refreshCart = async (accountId) => {
  const cart = await getCartWithDetails(accountId);
  if (!cart) throw ApiError.notFound("Không tìm thấy giỏ hàng");

  const variantIds = cart.cartItems.map((i) => i.productVariantId);
  const variants = await ProductVariant.find({
    _id: { $in: variantIds },
  }).populate("productId");

  const validItems = cart.cartItems.filter((item) => {
    const variant = variants.find((v) => v._id.equals(item.productVariantId));
    return variant && variant.stock > 0 && variant.productId;
  });

  cart.cartItems = validItems;
  await cart.save();

  return await cart.populate("cartItems.productVariantId");
};

/**
 * Cập nhật tồn kho sau khi đặt hàng
 */
export const updateStockAfterOrder = async (orderItems) => {
  return await withTransaction(async (session) => {
    for (const item of orderItems) {
      await ProductVariant.findByIdAndUpdate(
        item.productVariantId,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }
  });
};
