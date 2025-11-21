import {
	ProductVariant,
	VariantAttributePair,
	ProductVariantBulkItem,
} from "./productVariant.types";

/**
 * Kiểu dữ liệu rút gọn cho một sản phẩm trong danh sách (ví dụ: trang chủ).
 * Nó sẽ được tạo ra từ kiểu `Product` đầy đủ.
 */
export interface ProductListItem {
	_id: string;
	name: string; // Tên đã được chuẩn hóa
	thumbnail: string; // Ảnh đại diện
	basePrice: number;
	// slug?: string;    // (Tùy chọn)
}

/**
 * Thông tin cơ bản của shop
 */
export interface ProductShopInfo {
	_id: string;
	shopName: string;
	logoUrl?: string;
}

/**
 * Chi tiết từng biến thể trong ProductDetail
 * hỗ trợ lấy chi tiết
 */
export interface ProductVariantDetail {
	_id: string;
	variantKey: string;
	stock: number;
	image: string;
	priceAdjustment: number;
	attributes: ProductVariantAttributeDetail[];
}

/**
 * Chi tiết từng attribute trong biến thể
 */
export interface ProductVariantAttributeDetail {
	attributeId: string | null;
	attributeLabel: string | null;
	valueId: string | null;
	valueLabel: string | null;
}

/**
 * Dữ liệu Product trả về từ API
 */
export interface Product {
	_id: string;
	pdName: string;
	basePrice: number;
	description?: string;
	images: string[];
	shopId: string | ProductShopInfo; // nếu populate shop info
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	variants?: ProductVariantDetail[]; // kèm biến thể nếu chi tiết
}
export interface ProductDetailShopInfo {
	_id: string;
	shopName: string;
	logoUrl?: string;
	isOnline: boolean;
	lastActiveAt: string | null; // ISO datetime hoặc null
	lastActiveText: string | null; // "Hoạt động 5 phút trước"
	accountId: string | null; // ID tài khoản gốc của shop
}
export interface ProductDetail {
	_id: string;
	pdName: string;
	basePrice: number;
	description?: string;
	images: string[];
	shopId: string | ProductDetailShopInfo; // nếu populate shop info
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	variants?: ProductVariantDetail[]; // kèm biến thể nếu chi tiết
}

export interface ShopFullInfo {
	_id: string;
	shopName: string;
	logoUrl?: string;
	coverUrl?: string;
	description?: string;
	status: "active" | "inactive";
	accountId: string;
	isDeleted: boolean;
	deletedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

//-------Tạo sản phẩm và các biến thể------

/**
 * Payload tạo sản phẩm mới kèm biến thể
 * - FE gửi form-data:
 *   - pdName: string
 *   - basePrice: number
 *   - description?: string
 *   - images?: file[]
 *   - variantsPayload?: ProductVariantBulkItem[] (JSON string)
 */
export interface CreateProductWithVariantsRequest {
	pdName: string;
	basePrice: number;
	description?: string;
	// Danh sách ảnh sản phẩm (FE gửi file form-data)
	images?: File[];
	// Danh sách biến thể (FE gửi JSON string)
	variantsPayload?: ProductVariantBulkItem[];
	// Các file upload của biến thể: key trùng với fileKey trong variantsPayload
}

//-------Cập nhật sản phẩm------
/**
 * --- Type cho API updateProductImages ---
 * FE gửi form-data:
 *  - images[]: file upload (tối đa 50)
 *  - keepImages: JSON string[] danh sách ảnh muốn giữ lại (tùy chọn)
 *  - mode: "add" | "keep" | "replace"
 */
export interface UpdateProductImagesRequest {
	images?: File[]; // ảnh upload mới
	keepImages?: string[]; // danh sách ảnh cũ muốn giữ (chỉ dùng cho mode "add" hoặc "keep")
	mode?: "add" | "keep" | "replace"; // chế độ cập nhật ảnh
}

/**
 * --- Type cho API updateProductBasicInfo ---
 * FE gửi JSON:
 *  - pdName?: string
 *  - basePrice?: number
 *  - description?: string
 */
export interface UpdateProductBasicInfoRequest {
	pdName?: string;
	basePrice?: number;
	description?: string;
}

//----------Search---------------
// Search Request Type
export type ProductSearchRequest = {
	query?: string; // tìm theo tên sản phẩm hoặc shopName (admin)
	status?: "all" | "active" | "inactive"; // chế độ lọc theo active
	priceRange?: "<100" | "100-300" | "300-500" | "500-1000" | "1000<"; //chế độ lọc theo giá
	page?: number;
	limit?: number;
};
// Search Response Type
export interface ProductAdmin extends Product {
	shopId: ProductShopInfo; // Luôn populate shop info cho admin
}

//search cho admin
export interface ProductSearchResponseDataAdmin {
	products: ProductAdmin[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

//search cho shop
export interface ProductSearchResponseDataShop {
	products: Product[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

//------Count-----------
export interface ProductCountResponse {
	total: number;
}
