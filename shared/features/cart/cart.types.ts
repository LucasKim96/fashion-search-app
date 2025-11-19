// file: shared/features/cart/cart.types.ts
// Thông tin rút gọn của sản phẩm và biến thể để hiển thị trong giỏ hàng
interface CartItemProduct {
	_id: string;
	name: string;
}

interface CartItemVariantAttribute {
	attribute: string;
	value: string;
}

interface CartItemVariant {
	_id: string;
	imageUrl?: string;
	attributes: CartItemVariantAttribute[];
}

export interface CartItem {
	product: any; // Kiểu `any` để linh hoạt, hoặc định nghĩa kiểu chi tiết hơn
	productVariant: any;
	productVariantId: string;
	quantity: number;
	price: number; // Sẽ nhận `finalPrice` từ backend
}

// Cấu trúc đầy đủ của giỏ hàng
export interface Cart {
	// _id?: string; // Giỏ hàng có thể không có _id nếu được tạo động
	accountId: string;
	items: CartItem[];
	subtotal: number; // Sẽ nhận `totalAmount` từ backend
	totalQuantity: number; // Sẽ nhận `itemCount` từ backend
}

// Dữ liệu cần gửi lên khi thêm sản phẩm
export interface AddToCartRequest {
	productVariantId: string;
	quantity: number;
}

// Dữ liệu cần gửi lên khi cập nhật số lượng
export interface UpdateCartItemRequest {
	quantity: number;
}
