import * as CartService from "./cart.service.js";
import { apiResponse, ApiError } from "../../utils/index.js";

const { successResponse } = apiResponse;

const formatCartForResponse = (cartData, accountId) => {
	const { totalAmount, itemCount, itemsWithFinalPrice } = cartData;

	return {
		accountId: accountId,
		items: itemsWithFinalPrice.map((i) => {
			// --- XỬ LÝ ATTRIBUTES ---
			// Chuyển từ Object lồng nhau của Mongoose sang dạng phẳng cho Frontend
			const formattedAttributes =
				i.productVariant?.attributes?.map((attr) => {
					// Kiểm tra null safety (vì có thể populate thất bại nếu ID sai)
					const attrDef = attr.attributeId || {};
					const attrVal = attr.valueId || {};

					return {
						// Các trường này khớp với Frontend đang gọi
						attributeLabel: attrDef.label || attrDef.name || "Thuộc tính",
						valueLabel: attrVal.label || attrVal.value || "Giá trị",

						// Giữ lại ID gốc nếu cần
						attributeId: attrDef._id,
						valueId: attrVal._id,
					};
				}) || [];

			// Tạo object variant mới với attributes đã format
			const formattedVariant = {
				...(i.productVariant.toObject
					? i.productVariant.toObject()
					: i.productVariant), // Chuyển sang plain object nếu cần
				attributes: formattedAttributes,
			};

			return {
				product: i.product,
				productVariant: formattedVariant,
				productVariantId: i.productVariant._id.toString(),
				quantity: i.quantity,
				price: i.finalPrice,
			};
		}),
		subtotal: totalAmount,
		totalQuantity: itemCount,
	};
};

// Lấy giỏ hàng
export const getCart = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");

		// 1. Chỉ cần gọi calculateCartTotal
		const cartDataFromService = await CartService.calculateCartTotal(accountId);

		// 2. Dùng helper để định dạng lại
		const responseCart = formatCartForResponse(cartDataFromService, accountId);

		return successResponse(res, responseCart, "Lấy giỏ hàng thành công");
	} catch (error) {
		next(error);
	}
};

// Thêm sản phẩm vào giỏ
export const addItem = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		const { productVariantId, quantity } = req.body;
		if (!accountId || !productVariantId || !quantity)
			throw ApiError.badRequest("Thiếu thông tin cần thiết");

		// 1. Thực hiện hành động
		await CartService.addToCart(accountId, productVariantId, quantity);

		// 2. Lấy dữ liệu mới nhất, tính toán và định dạng để trả về
		const cartDataFromService = await CartService.calculateCartTotal(accountId);
		const responseCart = formatCartForResponse(cartDataFromService, accountId);

		return successResponse(res, responseCart, "Thêm sản phẩm thành công");
	} catch (error) {
		next(error);
	}
};

// Cập nhật số lượng
export const updateQuantity = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		const { productVariantId } = req.params; // Sửa để lấy từ params cho đúng RESTful
		const { quantity } = req.body;
		if (!accountId || !productVariantId || quantity === undefined)
			throw ApiError.badRequest("Thiếu thông tin cần thiết");

		await CartService.updateItemQuantity(accountId, productVariantId, quantity);

		const cartDataFromService = await CartService.calculateCartTotal(accountId);
		const responseCart = formatCartForResponse(cartDataFromService, accountId);

		return successResponse(res, responseCart, "Cập nhật số lượng thành công");
	} catch (error) {
		next(error);
	}
};

// Xóa sản phẩm
export const removeItem = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		const { productVariantId } = req.params;
		if (!accountId || !productVariantId)
			throw ApiError.badRequest("Thiếu ID sản phẩm");

		await CartService.removeFromCart(accountId, productVariantId);

		const cartDataFromService = await CartService.calculateCartTotal(accountId);
		const responseCart = formatCartForResponse(cartDataFromService, accountId);

		return successResponse(res, responseCart, "Xóa sản phẩm thành công");
	} catch (error) {
		next(error);
	}
};

// Xóa toàn bộ giỏ
export const clearCart = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");

		await CartService.clearCart(accountId);

		// Sau khi xóa, giỏ hàng sẽ rỗng
		const cartDataFromService = await CartService.calculateCartTotal(accountId);
		const responseCart = formatCartForResponse(cartDataFromService, accountId);

		return successResponse(res, responseCart, "Đã xóa toàn bộ giỏ hàng");
	} catch (error) {
		next(error);
	}
};

// Bulk add
export const bulkAdd = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		const { items } = req.body;

		if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");
		if (!items || !Array.isArray(items) || items.length === 0)
			throw ApiError.badRequest("Danh sách sản phẩm không hợp lệ");

		// 1. Thực hiện hành động bulk add
		await CartService.bulkAdd(accountId, items);

		// 2. Lấy dữ liệu mới nhất, tính toán và định dạng để trả về
		const cartDataFromService = await CartService.calculateCartTotal(accountId);
		const responseCart = formatCartForResponse(cartDataFromService, accountId);

		return successResponse(res, responseCart, "Đã thêm nhiều sản phẩm vào giỏ");
	} catch (error) {
		next(error);
	}
};

// Refresh cart
export const refreshCart = async (req, res, next) => {
	try {
		const accountId = req.user?.id;
		if (!accountId) throw ApiError.unauthorized("Chưa đăng nhập");

		// 1. Thực hiện hành động refresh
		await CartService.refreshCart(accountId);

		// 2. Lấy dữ liệu mới nhất, tính toán và định dạng để trả về
		const cartDataFromService = await CartService.calculateCartTotal(accountId);
		const responseCart = formatCartForResponse(cartDataFromService, accountId);

		return successResponse(
			res,
			responseCart,
			"Đã đồng bộ lại giỏ hàng thành công"
		);
	} catch (error) {
		next(error);
	}
};
