// file: shared/features/cart/cart.types.ts

// Kiểu dữ liệu rút gọn cho Product, được populate trong item
interface CartItemProduct {
	_id: string;
	name: string;
	// Bạn có thể thêm các trường khác nếu backend populate, ví dụ: slug
}

// Kiểu dữ liệu rút gọn cho ProductVariant, được populate trong item
interface CartItemVariant {
	_id: string;
	imageUrl?: string;
	attributes: {
		attribute: string;
		value: string;
		// Thêm các trường khác nếu backend populate, ví dụ: color, hex
	}[];
	// Bạn có thể thêm các trường khác nếu backend populate, ví dụ: sku, stock
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
