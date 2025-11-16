import { ProductVariant, VariantAttributePair, ProductVariantBulkItem} from "./productVariant.types";

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
  images?: File[];           // ảnh upload mới
  keepImages?: string[];      // danh sách ảnh cũ muốn giữ (chỉ dùng cho mode "add" hoặc "keep")
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