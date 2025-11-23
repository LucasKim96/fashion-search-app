// shared/features/order/order.types.ts

export type OrderStatus =
	| "pending"
	| "confirmed"
	| "packing"
	| "shipping"
	| "delivered"
	| "completed"
	| "cancelled";

export interface OrderItemSnapshot {
	productId: string;
	productVariantId: string;
	quantity: number;
	finalPriceAtOrder: number;
	pdNameAtOrder: string;
	imageAtOrder: string;
	attributesAtOrder: {
		attributeName: string;
		valueName: string;
	}[];
}

export interface OrderShopInfo {
	_id: string;
	shopName: string;
	logoUrl?: string;
}

export interface Order {
	_id: string;
	orderCode?: string;
	totalAmount: number;
	status: OrderStatus;
	addressLine: string;
	receiverName: string;
	phone: string;
	note?: string;
	shopId: OrderShopInfo; // Đã populate
	orderItems: OrderItemSnapshot[];
	createdAt: string;
	updatedAt: string;
}

export interface OrderListResponse {
	data: Order[];
	pagination: {
		currentPage: number;
		totalItems: number;
		totalPages: number;
	};
}
