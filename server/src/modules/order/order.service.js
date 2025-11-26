import { Order, Cart, Product, ProductVariant } from "../index.js";
import { ApiError, withTransaction } from "../../utils/index.js";
import { Account } from "../account/index.js";
import { calculateCartTotal } from "../cart/cart.service.js"; // hoặc đúng path sếp dùng

/*Buyer: Tạo đơn hàng từ giỏ*/

export const createOrderFromCart = async (accountId, data) => {
	const { addressLine, receiverName, phone, note } = data;

	// 1. Lấy giỏ hàng (giữ nguyên logic check giỏ hàng trống)
	const cart = await Cart.findOne({ accountId });
	if (!cart || cart.items.length === 0)
		throw ApiError.badRequest("Giỏ hàng trống");

	// 2. Tính toán giá (Giả sử hàm này đã chuẩn)
	const { itemsWithFinalPrice } = await calculateCartTotal(accountId);

	if (!itemsWithFinalPrice || itemsWithFinalPrice.length === 0) {
		throw ApiError.badRequest("Không có sản phẩm hợp lệ để thanh toán");
	}

	try {
		const shopOrders = {};

		// 3. Gom nhóm sản phẩm theo Shop (Thêm logic Check Null an toàn)
		for (const item of itemsWithFinalPrice) {
			const { productVariant, quantity, finalPrice } = item;

			// [FIX LỖI 500] Kiểm tra kỹ dữ liệu trước khi truy cập
			if (!productVariant) continue; // Variant bị xóa thì bỏ qua

			const product = productVariant.productId; // Do populate lồng nhau
			if (!product) continue; // Product bị xóa thì bỏ qua

			// Xử lý ShopID an toàn (chấp nhận cả string hoặc object populate)
			let shopIdString = "";
			if (product.shopId && typeof product.shopId === "object") {
				shopIdString = product.shopId._id.toString();
			} else if (product.shopId) {
				shopIdString = product.shopId.toString();
			} else {
				console.error("Product missing shopId:", product._id);
				continue;
			}

			if (!shopOrders[shopIdString]) shopOrders[shopIdString] = [];

			shopOrders[shopIdString].push({
				productId: product._id,
				productVariantId: productVariant._id,
				quantity,
				finalPriceAtOrder: finalPrice,
				// Map đúng trường Schema yêu cầu
				pdNameAtOrder: product.pdName || product.name || "Sản phẩm",
				imageAtOrder:
					productVariant.image || (product.images && product.images[0]) || "",
				// Lưu attributes snapshot để lịch sử đơn hàng không bị mất khi sửa variant
				attributesAtOrder:
					productVariant.attributes?.map((attr) => ({
						attributeName:
							attr.attributeId?.label || attr.attributeId?.name || "Thuộc tính",
						valueName: attr.valueId?.label || attr.valueId?.value || "Giá trị",
					})) || [],
			});
		}

		const createdOrders = [];

		// 4. Tạo đơn hàng cho từng Shop
		for (const [shopId, orderItems] of Object.entries(shopOrders)) {
			if (orderItems.length === 0) continue;

			const totalAmount = orderItems.reduce(
				(sum, i) => sum + i.finalPriceAtOrder * i.quantity,
				0
			);

			// Tạo đơn hàng
			const newOrder = await Order.create({
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
					{ status: "pending", note: "Đơn hàng được tạo thành công" },
				],
			});

			createdOrders.push(newOrder);
		}

		if (createdOrders.length === 0) {
			throw ApiError.badRequest(
				"Không thể tạo đơn hàng (Dữ liệu sản phẩm lỗi)"
			);
		}

		// 5. Xóa giỏ hàng sau khi tạo đơn thành công
		cart.items = [];
		await cart.save();

		return createdOrders;
	} catch (error) {
		// Log lỗi ra terminal server để debug
		console.error("Create Order Error:", error);
		throw error; // Ném tiếp lỗi để controller bắt
	}
};

/*Buyer: Lấy đơn của chính mình*/
export const getOrdersByBuyer = async (
	accountId,
	{ page = 1, limit = 10, status = "all" }
) => {
	page = Math.max(Number(page) || 1, 1);
	limit = Math.min(Math.max(Number(limit) || 10, 1), 50);

	const filter = { accountId };
	if (status && status !== "all") filter.status = status;

	const total = await Order.countDocuments(filter);
	const orders = await Order.find(filter)
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

/*Buyer: Chi tiết đơn*/
export const getOrderDetailForBuyer = async (orderId, accountId) => {
	const order = await Order.findOne({ _id: orderId, accountId }).populate(
		"shopId",
		"shopName logoUrl"
	);
	if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");
	return order;
};

/*Buyer confirm nhận hàng*/
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

/*Buyer báo cáo sự cố*/
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

/*Buyer huỷ đơn*/
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

/*Seller: Lấy danh sách đơn của shop*/
export const getOrdersByShop = async (
	shopId,
	{ page = 1, limit = 10, status = "all" }
) => {
	page = Math.max(Number(page) || 1, 1);
	limit = Math.min(Math.max(Number(limit) || 10, 1), 50);

	const filter = { shopId };
	if (status && status !== "all") filter.status = status;

	const total = await Order.countDocuments(filter);
	const orders = await Order.find(filter)
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

export const getOrderDetailForShop = async (orderId, shopId) => {
	// Tìm đơn hàng khớp cả ID và ShopID
	const order = await Order.findOne({ _id: orderId, shopId })
		.populate("accountId", "username phoneNumber avatar") // Populate thông tin người mua
		.populate("orderItems.productVariantId"); // Populate biến thể (nếu cần check tồn kho realtime)

	if (!order) {
		throw ApiError.notFound(
			"Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về shop của bạn"
		);
	}

	return order;
};

/*Seller huỷ đơn hàng*/
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
	if (order.status !== "pending") {
		throw ApiError.badRequest(
			"Chỉ được hủy đơn khi đang ở trạng thái 'pending'"
		);
	}
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

	return await withTransaction(async (session) => {
		// --- SỬA LOGIC HOÀN KHO ---
		// Chỉ hoàn kho nếu đơn hàng ĐÃ trừ kho (tức là trạng thái packing trở đi)
		// Nhưng theo logic hiện tại của bạn, Seller chỉ được hủy khi 'pending'.
		// Nếu đơn là 'pending' -> Chưa trừ kho -> KHÔNG CẦN CỘNG LẠI.

		// Nếu bạn mở rộng cho phép hủy cả đơn 'packing' thì mới cần logic dưới:
		if (["packing", "shipping"].includes(order.status)) {
			for (const item of order.orderItems) {
				await ProductVariant.updateOne(
					{ _id: item.productVariantId },
					{ $inc: { stock: item.quantity } },
					{ session }
				);
			}
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
		};
	});
};

/*Seller xác nhận đơn hàng (Chuyển sang Packing)
 * -> Kích hoạt trừ tồn kho tại đây
 */
export const updateStatusPacking = async (orderId, shopId) => {
	// Sử dụng Transaction để đảm bảo an toàn dữ liệu
	return await withTransaction(async (session) => {
		const order = await Order.findOne({ _id: orderId, shopId }).session(
			session
		);
		if (!order) throw ApiError.notFound("Không tìm thấy đơn hàng");
		if (order.status !== "pending")
			throw ApiError.badRequest(
				"Đơn hàng phải ở trạng thái pending mới được đóng gói"
			);

		// --- LOGIC TRỪ TỒN KHO ---
		for (const item of order.orderItems) {
			// Tìm và trừ tồn kho. Điều kiện: stock phải >= số lượng mua
			const updatedVariant = await ProductVariant.findOneAndUpdate(
				{
					_id: item.productVariantId,
					stock: { $gte: item.quantity }, // Quan trọng: Chặn nếu không đủ hàng
				},
				{ $inc: { stock: -item.quantity } }, // Trừ số lượng
				{ session, new: true }
			);

			if (!updatedVariant) {
				throw ApiError.badRequest(
					`Sản phẩm "${item.pdNameAtOrder}" (Biến thể) không đủ tồn kho để xác nhận đơn này.`
				);
			}
		}

		// --- Cập nhật trạng thái đơn ---
		order.status = "packing";
		order.statusHistory.push({
			status: "packing",
			note: "Shop đã xác nhận và đang chuẩn bị hàng (Đã trừ tồn kho)",
			changedAt: new Date(),
		});

		await order.save({ session });
		return order;
	});
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

/*Admin force complete*/
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

/** ADMIN CANCEL ORDER */
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
		// --- SỬA LOGIC HOÀN KHO ---
		// Chỉ hoàn kho nếu đơn không phải là 'pending'
		if (order.status !== "pending" && order.status !== "cancelled") {
			for (const item of order.orderItems) {
				await ProductVariant.updateOne(
					{ _id: item.productVariantId },
					{ $inc: { stock: item.quantity } },
					{ session }
				);
			}
		}

		order.status = "cancelled";
		order.statusHistory.push({
			status: "cancelled",
			note: reason,
			changedAt: new Date(),
		});
		await order.save({ session });

		return { message: "Admin huỷ đơn hàng thành công" };
	});
};

/** REVIEW REPORTED ORDER */
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

export const autoTransitionOrders = async () => {
	const now = new Date();
	const oneDay = 24 * 60 * 60 * 1000;

	const updatedOrders = [];
	const failedOrders = []; // Theo dõi đơn lỗi

	// 1. PENDING → PACKING (Cần trừ tồn kho)
	const pendingOrders = await Order.find({
		status: "pending",
		createdAt: { $lte: new Date(now - oneDay) },
	});

	for (const o of pendingOrders) {
		// Dùng try/catch để nếu 1 đơn lỗi (hết hàng) thì không chặn các đơn khác
		try {
			await withTransaction(async (session) => {
				// --- LOGIC TRỪ KHO ---
				for (const item of o.orderItems) {
					const updatedVariant = await ProductVariant.findOneAndUpdate(
						{
							_id: item.productVariantId,
							stock: { $gte: item.quantity }, // Kiểm tra đủ hàng
						},
						{ $inc: { stock: -item.quantity } },
						{ session, new: true }
					);

					if (!updatedVariant) {
						throw new Error(`Sản phẩm ${item.pdNameAtOrder} hết hàng`);
					}
				}

				// --- CẬP NHẬT TRẠNG THÁI ---
				o.status = "packing";
				o.statusHistory.push({
					status: "packing",
					note: "Auto chuyển sau 1 ngày (Đã trừ tồn kho)",
					changedAt: now,
				});
				await o.save({ session });
			});

			updatedOrders.push(o._id);
		} catch (error) {
			console.error(
				`Auto transition failed for Order ${o._id}:`,
				error.message
			);
			failedOrders.push({ id: o._id, reason: error.message });
			// Tùy chọn: Có thể đánh dấu đơn này là cần shop xử lý thủ công
		}
	}

	// 2. PACKING → SHIPPING (Không cần trừ kho nữa vì đã trừ ở bước 1)
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

	// 3. SHIPPING → COMPLETED (Không ảnh hưởng kho)
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
		failedCount: failedOrders.length,
		updatedOrders,
		failedDetails: failedOrders, // Trả về để Admin biết đơn nào treo
	};
};
