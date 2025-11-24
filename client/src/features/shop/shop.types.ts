// file: client/features/shop/shop.types.ts

// Kiểu dữ liệu trả về của một shop từ server
export interface ShopResponse {
	_id: string;
	shopName: string;
	logoUrl: string;
	coverUrl: string;
	description: string;
	accountId: string;
	status: "active" | "closed" | "suspended"; // Cập nhật cho khớp với backend service
	createdAt: string;
	updatedAt: string;
	isDeleted: boolean; // Bắt buộc, để kiểm tra trạng thái ẩn/hiện
	deletedAt: string | null; // Tùy chọn, để biết thời điểm bị ẩn
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
