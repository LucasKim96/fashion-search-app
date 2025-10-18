// server/src/modules/order/order.service.js
import Order from "./order.model.js";
import Cart from "../cart/cart.model.js";
import ProductVariant from "../product/productVariant.model.js";
import Product from "../product/product.model.js";
import Shop from "../shop/shop.model.js";
import mongoose from "mongoose";
import ApiError from "../../utils/apiError.js";

/**
 * Tạo mã đơn hàng duy nhất
 */
const generateOrderCode = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

/**
 * Tạo đơn hàng từ giỏ hàng
 */
export const createOrderFromCart = async (accountId, orderData) => {
  const { addressLine, receiverName, phone, note } = orderData;

  // 1️⃣ Validate dữ liệu đầu vào
  if (!addressLine || !receiverName || !phone) {
    throw ApiError.badRequest(
      "Thiếu thông tin địa chỉ, tên người nhận hoặc số điện thoại"
    );
  }

  // 2️⃣ Lấy giỏ hàng với thông tin đầy đủ
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

  if (!cart || cart.cartItems.length === 0) {
    throw ApiError.badRequest("Giỏ hàng trống");
  }

  // 3️⃣ Kiểm tra shop status và tồn kho
  const validItems = [];
  let totalAmount = 0;

  for (const item of cart.cartItems) {
    const variant = item.productVariantId;
    if (!variant || !variant.productId) continue;

    const product = variant.productId;
    if (!product || !product.shopId) continue;

    const shop = product.shopId;

    // Kiểm tra shop còn hoạt động
    if (shop.status !== "active") {
      throw ApiError.badRequest(
        `Shop ${shop.shopName} đã đóng, không thể đặt hàng`
      );
    }

    // Kiểm tra tồn kho
    if (variant.stock < item.quantity) {
      throw ApiError.badRequest(
        `Sản phẩm ${product.pdName} chỉ còn ${variant.stock} sản phẩm trong kho`
      );
    }

    validItems.push({
      productVariantId: variant._id,
      quantity: item.quantity,
      priceAtOrder: variant.price,
    });

    totalAmount += variant.price * item.quantity;
  }

  if (validItems.length === 0) {
    throw ApiError.badRequest("Không có sản phẩm hợp lệ để đặt hàng");
  }

  // 4️⃣ Tạo đơn hàng
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = new Order({
      orderCode: generateOrderCode(),
      status: "pending",
      totalAmount,
      addressLine,
      receiverName,
      phone,
      note: note || "",
      accountId,
      orderItems: validItems,
    });

    const savedOrder = await order.save({ session });

    // 5️⃣ Cập nhật tồn kho
    for (const item of validItems) {
      await ProductVariant.findByIdAndUpdate(
        item.productVariantId,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // 6️⃣ Xóa giỏ hàng
    await Cart.findByIdAndDelete(cart._id, { session });

    await session.commitTransaction();
    session.endSession();

    // 7️⃣ Populate thông tin đầy đủ để trả về
    const populatedOrder = await Order.findById(savedOrder._id).populate({
      path: "orderItems.productVariantId",
      populate: {
        path: "productId",
        populate: {
          path: "shopId",
          select: "shopName",
        },
      },
    });

    return populatedOrder;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Lấy danh sách đơn hàng của user
 */
export const getOrdersByAccount = async (
  accountId,
  filters = {},
  options = {}
) => {
  const { page = 1, limit = 10, status } = options;
  const query = { accountId };

  // Filter theo status
  if (status) {
    const validStatuses = [
      "pending",
      "packing",
      "shipping",
      "delivered",
      "completed",
      "cancelled",
    ];
    if (validStatuses.includes(status)) {
      query.status = status;
    }
  }

  // Pagination
  const skip = (page - 1) * limit;
  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .populate({
      path: "orderItems.productVariantId",
      populate: {
        path: "productId",
        populate: {
          path: "shopId",
          select: "shopName",
        },
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    data: orders,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
    },
  };
};

/**
 * Lấy chi tiết đơn hàng
 */
export const getOrderById = async (orderId, accountId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw ApiError.badRequest("ID đơn hàng không hợp lệ");
  }

  const order = await Order.findOne({ _id: orderId, accountId }).populate({
    path: "orderItems.productVariantId",
    populate: {
      path: "productId",
      populate: {
        path: "shopId",
        select: "shopName",
      },
    },
  });

  if (!order) {
    throw ApiError.notFound("Không tìm thấy đơn hàng");
  }

  return order;
};

/**
 * Cập nhật trạng thái đơn hàng (chỉ shop owner hoặc admin)
 */
export const updateOrderStatus = async (
  orderId,
  newStatus,
  updaterAccountId
) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw ApiError.badRequest("ID đơn hàng không hợp lệ");
  }

  const validStatuses = [
    "pending",
    "packing",
    "shipping",
    "delivered",
    "completed",
    "cancelled",
  ];
  if (!validStatuses.includes(newStatus)) {
    throw ApiError.badRequest("Trạng thái đơn hàng không hợp lệ");
  }

  const order = await Order.findById(orderId).populate({
    path: "orderItems.productVariantId",
    populate: {
      path: "productId",
      populate: {
        path: "shopId",
      },
    },
  });

  if (!order) {
    throw ApiError.notFound("Không tìm thấy đơn hàng");
  }

  // TODO: Kiểm tra quyền - chỉ shop owner hoặc admin mới được cập nhật
  // Hiện tại bỏ qua check quyền, có thể thêm sau

  // Cập nhật trạng thái
  order.status = newStatus;

  // Nếu đã giao hàng, cập nhật thời gian giao
  if (newStatus === "delivered") {
    order.deliverAt = new Date();
  }

  await order.save();

  return order;
};

/**
 * Hủy đơn hàng (chỉ user đã đặt)
 */
export const cancelOrder = async (orderId, accountId) => {
  const order = await Order.findOne({ _id: orderId, accountId });

  if (!order) {
    throw ApiError.notFound("Không tìm thấy đơn hàng");
  }

  // Chỉ cho phép hủy khi đơn hàng còn pending
  if (order.status !== "pending") {
    throw ApiError.badRequest("Chỉ có thể hủy đơn hàng khi đang chờ xử lý");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Cập nhật trạng thái
    order.status = "cancelled";
    await order.save({ session });

    // Hoàn lại tồn kho
    for (const item of order.orderItems) {
      await ProductVariant.findByIdAndUpdate(
        item.productVariantId,
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Lấy thống kê đơn hàng cho shop (TODO: Cần implement sau)
 */
export const getShopOrderStats = async (shopId) => {
  // TODO: Implement thống kê đơn hàng cho shop
  // Có thể thêm sau khi có đủ dữ liệu
  return {
    message: "Chức năng thống kê đơn hàng sẽ được implement sau",
    shopId,
  };
};
