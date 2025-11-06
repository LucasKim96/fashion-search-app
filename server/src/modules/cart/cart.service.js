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
    } else {
      cart.cartItems.push({
        productId: product._id,
        productVariantId: variant._id,
        quantity,
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
 * Lấy giỏ hàng chi tiết
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
 * Tính tổng tiền giỏ hàng (dùng giá hiện tại)
 */
export const calculateCartTotal = async (accountId) => {
  const cart = await getCartWithDetails(accountId);

  const itemsWithFinalPrice = cart.cartItems.map((item) => {
    const variant = item.productVariantId;
    const product = variant?.productId;

    const finalPrice =
      variant?.price ??
      (product?.basePrice || 0) + (variant?.priceAdjustment || 0);

    return {
      productVariant: variant,
      product: product,
      quantity: item.quantity,
      finalPrice,
    };
  });

  const summary = itemsWithFinalPrice.reduce(
    (acc, i) => {
      acc.total += i.finalPrice * i.quantity;
      acc.itemCount += i.quantity;
      return acc;
    },
    { total: 0, itemCount: 0 }
  );

  return {
    totalAmount: summary.total,
    itemCount: summary.itemCount,
    itemsWithFinalPrice,
  };
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
          attributes: variant.attributes || [],
        });
      }
    }

    await cart.save({ session });
    return await cart.populate("cartItems.productVariantId");
  });
};

/**
 * Làm mới giỏ hàng (loại bỏ variant hết hàng, ngưng hoạt động)
 */
export const refreshCart = async (accountId) => {
  const cart = await getCartWithDetails(accountId);
  if (!cart) throw ApiError.notFound("Không tìm thấy giỏ hàng");

  // Lấy toàn bộ variant đang nằm trong cart
  const variantIds = cart.cartItems.map((i) => i.productVariantId);
  const variants = await ProductVariant.find({
    _id: { $in: variantIds },
  }).populate({
    path: "productId",
    populate: { path: "shopId", select: "shopName status" },
  });

  // Lọc ra các item hợp lệ
  const validItems = [];
  for (const item of cart.cartItems) {
    const variant = variants.find((v) => v._id.equals(item.productVariantId));
    const product = variant?.productId;
    const shop = product?.shopId;

    if (!variant || !product || !shop) continue; // mất dữ liệu
    if (shop.status !== "active") continue; // shop bị khóa
    if (variant.stock <= 0) continue; // hết hàng

    // Đồng bộ lại dữ liệu variant/product hiện tại
    item.productId = product._id;
    item.attributes = variant.attributes || [];
    // Không lưu snapshot, nhưng nếu boss muốn hiển thị luôn ảnh mới thì:
    // item.image = variant.image || product.thumbnail; (nếu có field image trong cartItem)
    validItems.push(item);
  }

  cart.cartItems = validItems;
  await cart.save();

  // Populate lại thông tin sau khi làm mới
  return await cart.populate({
    path: "cartItems.productVariantId",
    populate: {
      path: "productId",
      populate: { path: "shopId", select: "shopName status" },
    },
  });
};

export const clearCart = async (accountId) => {
  const cart = await Cart.findOne({ accountId });
  if (!cart) throw ApiError.notFound("Không tìm thấy giỏ hàng");

  cart.cartItems = [];
  await cart.save();

  return cart; // Giỏ hàng rỗng, vẫn giữ accountId
};

/**
 * Xóa các sản phẩm (và variant) của những product bị xóa khỏi tất cả giỏ hàng
 */
export const removeProductsFromAllCarts = async (productIds) => {
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0)
    return;

  // Lấy toàn bộ variant thuộc các product bị xóa
  const variants = await ProductVariant.find(
    { productId: { $in: productIds } },
    { _id: 1 }
  );

  const variantIds = variants.map((v) => v._id);
  if (variantIds.length === 0) return;

  // Gỡ bỏ tất cả cartItems có chứa variantId thuộc danh sách này
  const result = await Cart.updateMany(
    {},
    { $pull: { cartItems: { productVariantId: { $in: variantIds } } } }
  );

  console.log(
    `🧹 Đã xóa ${variantIds.length} variants khỏi ${result.modifiedCount} giỏ hàng`
  );
};
