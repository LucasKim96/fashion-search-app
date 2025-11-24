// file: shared/features/cart/cart.types.ts
/**
 * Kiểu dữ liệu cho Product trong giỏ hàng
 * Cần khai báo đủ các trường có thể trả về để tránh lỗi TypeScript
 */
export interface CartItemProduct {
	_id: string;
	// Hỗ trợ cả 2 kiểu tên (mapped hoặc raw)
	name?: string;
	pdName?: string;
	// Hỗ trợ cả ảnh thumbnail hoặc mảng ảnh gốc
	thumbnail?: string;
	images?: string[];
	slug?: string;
}

/**
 * Kiểu dữ liệu cho ProductVariant trong giỏ hàng
 */
export interface CartItemVariant {
	_id: string;
	imageUrl?: string; // Cũ
	image?: string; // Mới
	attributes: {
		attributeLabel?: string; // Chuẩn format mới
		valueLabel?: string; // Chuẩn format mới
		attribute?: string; // Fallback cũ
		value?: string; // Fallback cũ
		name?: string;
	}[];
	stock?: number;
	priceAdjustment?: number;
}

/**
 * Kiểu dữ liệu cho MỘT item trong mảng `items` của giỏ hàng.
 */
export interface CartItem {
	product: CartItemProduct;
	productVariant: CartItemVariant;
	productVariantId: string;
	quantity: number;
	price: number; // Tên này khớp với `price` trong response của backend
}

/**
 * Cấu trúc đầy đủ của object Giỏ hàng mà API trả về.
 */
export interface Cart {
	accountId: string;
	items: CartItem[]; // <-- ĐÃ ĐỔI LẠI: `cartItems` thành `items`
	subtotal: number; // <-- ĐÃ ĐỔI LẠI: `totalAmount` thành `subtotal`
	totalQuantity: number; // <-- ĐÃ ĐỔI LẠI: `itemCount` thành `totalQuantity`
}

/**
 * Dữ liệu cần gửi lên khi thêm sản phẩm vào giỏ hàng.
 */
export interface AddToCartRequest {
	productVariantId: string;
	quantity: number;
}

/**
 * Dữ liệu cần gửi lên khi cập nhật số lượng của một item.
 */
export interface UpdateCartItemRequest {
	quantity: number;
}

/**
 * Kiểu dữ liệu cho MỘT item trong mảng `items` của giỏ hàng.
 */
export interface CartItem {
	product: CartItemProduct;
	productVariant: CartItemVariant;
	productVariantId: string;
	quantity: number;
	price: number;
}

/**
 * Cấu trúc đầy đủ của object Giỏ hàng mà API trả về.
 */
export interface Cart {
	accountId: string;
	items: CartItem[];
	subtotal: number;
	totalQuantity: number;
}

// ... (Các interface Request giữ nguyên)
export interface AddToCartRequest {
	productVariantId: string;
	quantity: number;
}

export interface UpdateCartItemRequest {
	quantity: number;
}
