import { Order, Cart, Product, ProductVariant } from "../index.js";
import { ApiError, withTransaction } from "../../utils/index.js";
import { Account } from "../account/index.js";
import { calculateCartTotal } from "../cart/cart.service.js"; // hoặc đúng path sếp dùng

/**
 * 👤 Buyer: Tạo đơn hàng từ giỏ
 */

export const createOrderFromCart = async (accountId, data) => {
  const { addressLine, receiverName, phone, note } = data;

  // 📦 Lấy giỏ hàng + populate đầy đủ
  const cart = await Cart.findOne({ accountId }).populate({
    path: "cartItems.productVariantId",
    populate: { path: "productId", select: "shopId productName imageUrl" },  options: { strictPopulate: false } 
  });

  if (!cart || cart.cartItems.length === 0)
    throw ApiError.badRequest("Giỏ hàng trống bro 🛒");

  // 💰 Tính lại giá chính xác từng variant bằng service
  const { itemsWithFinalPrice, totalAmount: cartTotal } =
    await calculateCartTotal(accountId);

  return await withTransaction(async (session) => {
    const shopOrders = {};

    // 🔧 Gộp theo shop
    for (const item of itemsWithFinalPrice) {
      const { productVariant, quantity, finalPrice } = item;
      const product = productVariant.productId;
      const shopId =
        typeof product.shopId === "object"
          ? product.shopId._id.toString()
          : product.shopId.toString();
    
      if (!shopOrders[shopId]) shopOrders[shopId] = [];
    
      shopOrders[shopId].push({
        productId: product._id,
        productVariantId: productVariant._id,
        quantity,
        finalPriceAtOrder: finalPrice,
        pdNameAtOrder: product.pdName, // đổi cho đúng schema
        imageAtOrder: product.imageUrl,
        attributesAtOrder: productVariant.attributes,
      });
    }
    

    const createdOrders = [];
    for (const [shopId, orderItems] of Object.entries(shopOrders)) {
      const totalAmount = orderItems.reduce(
        (sum, i) => sum + i.finalPriceAtOrder * i.quantity,
        0
      );

      const order = await Order.create(
        [
          {
            accountId,
            shopId,
            orderItems,
            totalAmount,
            addressLine,
            receiverName,
            phone,
            note,
            status: "pending",
            statusHistory: [
              { status: "pending", note: "Đơn hàng vừa được tạo" },
            ],
          },
        ],
        { session }
      );
      createdOrders.push(order[0]);
    }

    // 🧹 Xoá giỏ hàng sau khi đặt
    await Cart.deleteOne({ _id: cart._id }, { session });

    return createdOrders;
  });
};


/**
 * 👤 Buyer: Lấy đơn của chính mình
 */
export const getOrdersByBuyer = async (accountId, { page = 1, limit = 10 }) => {
  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 10, 1), 50);

  const total = await Order.countDocuments({ accountId });
  const orders = await Order.find({ accountId })
    .populate("shopId", "shopName logoUrl")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    data: orders,
    pagination: {
      currentPage: page,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * 👤 Buyer: Chi tiết đơn
 */
export const getOrderDetailForBuyer = async (orderId, accountId) => {
  const order = await Order.findOne({ _id: orderId, accountId }).populate(
    "shopId",
    "shopName logoUrl"
  );
  if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");
  return order;
};

/**
 * 🧩 Buyer confirm nhận hàng
 */
export const confirmOrderReceived = async (orderId, accountId) => {
  const order = await Order.findOne({ _id: orderId, accountId });
  if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");
  if (order.status !== "delivered")
    throw ApiError.badRequest("Chưa thể xác nhận vì đơn chưa giao xong");

  order.status = "confirmed";
  order.statusHistory.push({
    status: "confirmed",
    note: "Người mua xác nhận đã nhận hàng",
  });
  await order.save();
  return order;
};

/**
 * 🚨 Buyer báo cáo sự cố
 */
export const reportOrderIssue = async (orderId, accountId, note) => {
  const order = await Order.findOne({ _id: orderId, accountId });
  if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");

  order.statusHistory.push({
    status: order.status,
    note: note || "Người mua gửi báo cáo sự cố",
  });
  await order.save();
  return { message: "Đã báo cáo sự cố, admin sẽ xem xét sớm!" };
};

/**
 * ❌ Buyer hủy đơn khi pending
 */
export const cancelOrderByBuyer = async (orderId, accountId) => {
  const order = await Order.findOne({ _id: orderId, accountId });
  if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");
  if (order.status !== "pending")
    throw ApiError.badRequest("Chỉ có thể hủy khi đơn đang chờ xử lý");

  order.status = "cancelled";
  order.statusHistory.push({
    status: "cancelled",
    note: "Người mua tự hủy đơn",
  });
  await order.save();
  return order;
};

/**
 * Seller huỷ đơn hàng
 */
export const cancelBySeller = async (orderId, sellerId, reason = "") => {
  // Tìm đơn
  const order = await Order.findById(orderId)
    .populate("shopId", "accountId shopName")
    .populate("orderItems.productVariantId");

  if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");
  if (order.status === "cancelled")
    throw ApiError.badRequest("Đơn này đã bị huỷ rồi");
  if (["delivered", "completed"].includes(order.status))
    throw ApiError.badRequest("Không thể huỷ đơn đã giao hoặc hoàn tất");

  // Check quyền: phải là chủ shop của đơn hoặc admin
  const sellerAccount = await Account.findById(sellerId).populate(
    "roles",
    "roleName level"
  );
  if (!sellerAccount) throw ApiError.notFound("Tài khoản không tồn tại");

  const isOwner = order.shopId?.accountId?.toString() === sellerId.toString();
  const isAdmin = sellerAccount.roles.some(
    (r) => r.roleName === "Super Admin" || r.level >= 3
  );

  if (!isOwner && !isAdmin)
    throw ApiError.forbidden("Không có quyền huỷ đơn hàng này");

  // Transaction: rollback stock + update status
  return await withTransaction(async (session) => {
    // Rollback stock cho từng biến thể
    for (const item of order.orderItems) {
      await ProductVariant.updateOne(
        { _id: item.productVariantId },
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    // Update trạng thái
    order.status = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      note: reason || "Người bán đã huỷ đơn hàng",
      changedAt: new Date(),
    });
    await order.save({ session });

    return {
      message: "Đơn hàng đã được huỷ thành công",
      orderId: order._id,
      rollbackItems: order.orderItems.length,
    };
  });
};

/**
 * 🏪 Seller cập nhật trạng thái
 */
export const updateStatusPacking = async (orderId, shopId) => {
  const order = await Order.findOne({ _id: orderId, shopId });
  if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");
  if (order.status !== "pending")
    throw ApiError.badRequest("Đơn hàng phải ở trạng thái pending");

  order.status = "packing";
  order.statusHistory.push({
    status: "packing",
    note: "Shop đang chuẩn bị hàng",
  });
  await order.save();
  return order;
};

export const updateStatusShipping = async (orderId, shopId) => {
  const order = await Order.findOne({ _id: orderId, shopId });
  if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");
  if (order.status !== "packing")
    throw ApiError.badRequest("Chỉ có thể chuyển sang shipping từ packing");

  order.status = "shipping";
  order.statusHistory.push({
    status: "shipping",
    note: "Shop đã giao cho đơn vị vận chuyển",
  });
  await order.save();
  return order;
};

export const updateStatusDelivered = async (orderId, shopId) => {
  const order = await Order.findOne({ _id: orderId, shopId });
  if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");
  if (order.status !== "shipping")
    throw ApiError.badRequest("Chỉ có thể đánh dấu delivered từ shipping");

  order.status = "delivered";
  order.deliverAt = new Date();
  order.statusHistory.push({
    status: "delivered",
    note: "Shop đánh dấu đã giao",
  });
  await order.save();
  return order;
};

/**
 * 🧑‍💼 Admin force complete
 */
export const forceCompleteOrder = async (orderId, adminId) => {
  const admin = await Account.findById(adminId);
  if (!admin) throw ApiError.notFound("Admin không tồn tại");

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");

  order.status = "completed";
  order.statusHistory.push({
    status: "completed",
    note: "Admin hoàn tất đơn thủ công",
  });
  await order.save();
  return order;
};

/** 🧨 ADMIN CANCEL ORDER */
export const adminCancelOrder = async (
  orderId,
  adminId,
  reason = "Admin huỷ đơn"
) => {
  const order = await Order.findById(orderId).populate(
    "orderItems.productVariantId"
  );
  if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");
  if (order.status === "cancelled")
    throw ApiError.badRequest("Đơn này đã bị huỷ rồi");

  return await withTransaction(async (session) => {
    // Rollback stock
    for (const item of order.orderItems) {
      await ProductVariant.updateOne(
        { _id: item.productVariantId },
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    order.status = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      note: reason,
      changedAt: new Date(),
    });
    await order.save({ session });

    return {
      orderId: order._id,
      message: "Admin huỷ đơn hàng thành công",
      rollbackItems: order.orderItems.length,
    };
  });
};

/** 🕵️ REVIEW REPORTED ORDER */
export const reviewReportedOrder = async (
  orderId,
  adminId,
  action,
  note = ""
) => {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");

  if (order.status !== "shipping" && order.status !== "delivered") {
    throw ApiError.badRequest("Chỉ xử lý được đơn đang giao hoặc vừa giao");
  }

  let resultNote = "";
  switch (action) {
    case "approve_buyer":
      order.status = "cancelled";
      resultNote = "Admin phê duyệt huỷ cho người mua";
      break;
    case "approve_seller":
      order.status = "completed";
      resultNote = "Admin phê duyệt hoàn tất cho người bán";
      break;
    case "cancel_both":
      order.status = "cancelled";
      resultNote = "Admin huỷ cả 2 bên do tranh chấp";
      break;
    default:
      throw ApiError.badRequest("Hành động không hợp lệ");
  }

  order.statusHistory.push({
    status: order.status,
    note: `${resultNote}${note ? ` - ${note}` : ""}`,
    changedAt: new Date(),
  });

  await order.save();

  return {
    orderId: order._id,
    status: order.status,
    message: resultNote,
  };
};

/** 🤖 AUTO TRANSITION ORDERS */
export const autoTransitionOrders = async () => {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  const updatedOrders = [];

  // PENDING → PACKING (quá 1 ngày)
  const pendingOrders = await Order.find({
    status: "pending",
    createdAt: { $lte: new Date(now - oneDay) },
  });
  for (const o of pendingOrders) {
    o.status = "packing";
    o.statusHistory.push({
      status: "packing",
      note: "Auto chuyển sau 1 ngày",
      changedAt: now,
    });
    await o.save();
    updatedOrders.push(o._id);
  }

  // PACKING → SHIPPING (quá 3 ngày)
  const packingOrders = await Order.find({
    status: "packing",
    updatedAt: { $lte: new Date(now - 3 * oneDay) },
  });
  for (const o of packingOrders) {
    o.status = "shipping";
    o.statusHistory.push({
      status: "shipping",
      note: "Auto chuyển sau 3 ngày",
      changedAt: now,
    });
    await o.save();
    updatedOrders.push(o._id);
  }

  // SHIPPING → COMPLETED (auto sau 7 ngày)
  const shippingOrders = await Order.find({
    status: "shipping",
    updatedAt: { $lte: new Date(now - 7 * oneDay) },
  });
  for (const o of shippingOrders) {
    o.status = "completed";
    o.statusHistory.push({
      status: "completed",
      note: "Auto hoàn tất sau 7 ngày",
      changedAt: now,
    });
    await o.save();
    updatedOrders.push(o._id);
  }

  return {
    updatedCount: updatedOrders.length,
    updatedOrders,
  };
};
