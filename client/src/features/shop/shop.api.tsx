// src/features/shop/shop.api.ts
export interface CreateShopPayload {
	shopName: string;
	logoUrl?: string;
	coverUrl?: string;
	description?: string;
	accountId: string;
}

export const shopApi = {
	async createShop(data: CreateShopPayload) {
		const res = await fetch("/api/shops", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		const result = await res.json();

		if (!res.ok) throw new Error(result.message || "Không thể tạo shop");
		return result;
	},
};
