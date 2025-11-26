// file: client/features/shop/shop.types.ts

// Kiểu dữ liệu trả về của một shop từ server
export interface ShopAccountInfo {
	_id: string;
	username: string;
	phoneNumber?: string;
}

export interface ShopResponse {
	_id: string;
	shopName: string;
	logoUrl: string;
	coverUrl: string;
	description: string;
	accountId: string | ShopAccountInfo;
	status: "active" | "closed" | "suspended";
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
export type UpdateShopRequest = Partial<
	Omit<CreateShopRequest, "accountId">
> & {
	status?: "active" | "closed" | "suspended";
};
