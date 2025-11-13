// client/features/shop/shop.types.ts

// Kiểu dữ liệu trả về shop từ server
export interface ShopResponse {
	_id: string;
	shopName: string;
	logoUrl: string;
	coverUrl: string;
	description: string;
	accountId: string;
	status: "active" | "inactive" | "pending" | "banned"; // tuỳ backend
	createdAt: string;
	updatedAt: string;
}

// Kiểu dữ liệu gửi lên server khi tạo shop
export interface CreateShopRequest {
	shopName: string;
	logoUrl?: string;
	coverUrl?: string;
	description?: string;
	accountId: string;
}

// Kiểu dữ liệu cập nhật shop (partial)
export type UpdateShopRequest = Partial<CreateShopRequest> & {
	status?: "active" | "inactive" | "pending" | "banned";
};
