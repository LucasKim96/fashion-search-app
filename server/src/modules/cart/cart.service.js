import Cart from "./cart.model.js";
import { ApiError, validateObjectId } from "../../utils/index.js";
import { withTransaction } from "../../utils/index.js";
import { Product, ProductVariant } from "../product/index.js";
import { Shop } from "../shop/index.js";

const getOrCreateCart = async (accountId, session = null) => {
	let cart = await Cart.findOne({ accountId }).session(session);

	if (!cart) {
		console.log(`Không tìm thấy giỏ hàng cho ${accountId}, đang tạo mới...`);
		// Dùng create với mảng và lấy phần tử đầu tiên để hoạt động tốt với transaction
		const created = await Cart.create([{ accountId, items: [] }], {
			session,
		});
		cart = created[0];
	}

	return cart;
};

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

		// Chặn chủ shop mua hàng của chính mình
		if (String(shop.accountId) === String(accountId)) {
			throw ApiError.badRequest(
				"Bạn không thể thêm sản phẩm của chính shop mình vào giỏ hàng"
			);
		}

		// let cart = await Cart.findOne({ accountId }).session(session);
		const cart = await getOrCreateCart(accountId, session);
		if (!cart)
			cart = await Cart.create([{ accountId, items: [] }], {
				session,
			}).then(([c]) => c);

		const existingItem = cart.items.find(
			(item) => item.productVariantId.toString() === String(productVariantId)
		);

		if (existingItem) {
			existingItem.quantity += quantity;
		} else {
			cart.items.push({
				// productId: product._id,
				productVariantId: variant._id,
				quantity,
				attributes: variant.attributes || [],
			});
		}

		await cart.save({ session });
		return await cart.populate("items.productVariantId");
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

	const cart = await getOrCreateCart(accountId);
	if (!cart) throw ApiError.notFound("Không tìm thấy giỏ hàng");

	const item = cart.items.find(
		(i) => i.productVariantId.toString() === String(productVariantId)
	);
	if (!item) throw ApiError.notFound("Sản phẩm không có trong giỏ hàng");

	if (quantity <= 0) {
		cart.items = cart.items.filter(
			(i) => i.productVariantId.toString() !== String(productVariantId)
		);
	} else {
		item.quantity = quantity;
	}

	await cart.save();
	return await cart.populate("items.productVariantId");
};

/**
 * Xóa 1 sản phẩm khỏi giỏ hàng
 */
export const removeFromCart = async (accountId, productVariantId) => {
	validateObjectId(productVariantId, "ID sản phẩm");

	const cart = await getOrCreateCart(accountId);
	if (!cart) throw ApiError.notFound("Không tìm thấy giỏ hàng");

	const before = cart.items.length;
	cart.items = cart.items.filter(
		(i) => i.productVariantId.toString() !== String(productVariantId)
	);
	if (cart.items.length === before)
		throw ApiError.notFound("Sản phẩm không tồn tại trong giỏ hàng");

	await cart.save();
	return await cart.populate("items.productVariantId");
};

export const getCartWithDetails = async (accountId) => {
	if (!accountId) throw ApiError.badRequest("Thiếu accountId");

	// Đảm bảo cart tồn tại
	await getOrCreateCart(accountId);

	// Lấy Cart và Populate sâu
	let cart = await Cart.findOne({ accountId }).populate({
		path: "items.productVariantId",
		model: "ProductVariant", // Tên model Variant
		populate: [
			// 1. Populate Product gốc
			{
				path: "productId",
				select: "pdName basePrice images isActive shopId", // Chọn trường cần thiết
				populate: { path: "shopId", select: "shopName status" },
			},
			// 2. [QUAN TRỌNG] Populate Tên thuộc tính (VD: Màu sắc)
			{
				path: "attributes.attributeId",
				model: "Attribute", // Tên model Attribute
				select: "label name",
			},
			// 3. [QUAN TRỌNG] Populate Giá trị thuộc tính (VD: Đỏ)
			{
				path: "attributes.valueId",
				model: "AttributeValue", // Tên model Attribute Value
				select: "label value",
			},
		],
	});

	if (!cart) return await Cart.create({ accountId, items: [] });

	// Logic lọc item lỗi (Giữ nguyên)
	const validItems = cart.items.filter((item) => {
		const variant = item.productVariantId;
		const product = variant?.productId;
		const shop = product?.shopId;

		// Check thêm: variant.attributes phải là mảng (đề phòng data cũ lỗi)
		const isValidVariant = variant && Array.isArray(variant.attributes);

		return isValidVariant && product && shop && shop.status === "active";
	});

	if (validItems.length !== cart.items.length) {
		cart.items = validItems;
		await cart.save();
	}

	return cart;
};

/**
 * Tính tổng tiền giỏ hàng (dùng giá hiện tại)
 */
export const calculateCartTotal = async (accountId) => {
	const cart = await getCartWithDetails(accountId);

	const itemsWithFinalPrice = cart.items.map((item) => {
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
			cart = await Cart.create([{ accountId, items: [] }], {
				session,
			}).then(([c]) => c);

		for (const { productVariantId, quantity } of items) {
			validateObjectId(productVariantId, "ID sản phẩm");
			if (quantity <= 0) continue;

			const variant = await ProductVariant.findById(productVariantId)
				.populate("productId")
				.session(session);
			if (!variant || !variant.productId) continue;

			const existingItem = cart.items.find(
				(item) => item.productVariantId.toString() === String(productVariantId)
			);

			if (existingItem) existingItem.quantity += quantity;
			else {
				cart.items.push({
					// productId: variant.productId._id,
					productVariantId: variant._id,
					quantity,
					attributes: variant.attributes || [],
				});
			}
		}

		await cart.save({ session });
		return await cart.populate("items.productVariantId");
	});
};

/**
 * Làm mới giỏ hàng (loại bỏ variant hết hàng, ngưng hoạt động)
 */
export const refreshCart = async (accountId) => {
	const cart = await getOrCreateCart(accountId);
	if (!cart) throw ApiError.notFound("Không tìm thấy giỏ hàng");

	// Lấy toàn bộ variant đang nằm trong cart
	const variantIds = cart.items.map((i) => i.productVariantId);
	const variants = await ProductVariant.find({
		_id: { $in: variantIds },
	}).populate({
		path: "productId",
		populate: { path: "shopId", select: "shopName status" },
	});

	// Lọc ra các item hợp lệ
	const validItems = [];
	for (const item of cart.items) {
		const variant = variants.find((v) => v._id.equals(item.productVariantId));
		const product = variant?.productId;
		const shop = product?.shopId;

		if (!variant || !product || !shop) continue; // mất dữ liệu
		if (shop.status !== "active") continue; // shop bị khóa
		if (variant.stock <= 0) continue; // hết hàng

		// Đồng bộ lại dữ liệu variant/product hiện tại
		// item.productId = product._id;
		item.attributes = variant.attributes || [];
		// Không lưu snapshot, nhưng nếu boss muốn hiển thị luôn ảnh mới thì:
		// item.image = variant.image || product.thumbnail; (nếu có field image trong cartItem)
		validItems.push(item);
	}

	cart.items = validItems;
	await cart.save();

	// Populate lại thông tin sau khi làm mới
	return await cart.populate({
		path: "items.productVariantId",
		populate: {
			path: "productId",
			populate: { path: "shopId", select: "shopName status" },
		},
	});
};

export const clearCart = async (accountId) => {
	const cart = await getOrCreateCart(accountId);
	if (!cart) throw ApiError.notFound("Không tìm thấy giỏ hàng");

	cart.items = [];
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

	// Gỡ bỏ tất cả items có chứa variantId thuộc danh sách này
	const result = await Cart.updateMany(
		{},
		{ $pull: { items: { productVariantId: { $in: variantIds } } } }
	);

	console.log(
		`🧹 Đã xóa ${variantIds.length} variants khỏi ${result.modifiedCount} giỏ hàng`
	);
};
