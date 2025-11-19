/**
 * Kiểu của từng cặp attribute – value trong biến thể
 * Ví dụ: { attributeId: "...", valueId: "..." }
 */
export interface VariantAttributePair {
    attributeId: string;
    valueId: string;
}

// Dữ liệu 1 ProductVariant trả về từ API
export interface ProductVariant {
    _id: string;
    productId: string;
    variantKey: string;                    // ví dụ: "valid1|valid2"
    attributes: (VariantAttributePair & { _id: string })[];     // danh sách thuộc tính – giá trị
    stock: number;
    image: string;                          // ảnh biến thể riêng
    priceAdjustment: number;                // +10 / -15 ...
    createdAt: string;
    updatedAt: string;
}

/**
 * Request để sinh tổ hợp biến thể (generateVariantCombinations)
 * Không có productId
 */
export interface GenerateVariantCombinationsRequest {
    attributes: {
        attributeId: string;
        values: string[]; // danh sách valueId
    }[];
}

/**
 * Kết quả sinh tổ hợp biến thể
 */
export interface VariantGeneratedItem {
    variantKey: string;
    attributes: VariantAttributePair[];
}

/**
 * Request: sinh tổ hợp biến thể MỚI cho product (chưa có trong DB)
 */
export interface GenerateNewVariantCombinationsRequest {
    productId: string;
    attributes: {
        attributeId: string;
        values: string[];
    }[];
}

//-----Lấy danh sách các attribute cho product------
/**
 * Kết quả trả về khi gọi getProductAttributesWithValues(productId)
 */
export interface ProductAttributeValueItem {
    valueId: string;
    value: string;
    image: string;
    isUsed: boolean; // FE disable nếu đã dùng
}
export interface ProductAttributeWithValues {
    attributeId: string;
    label: string;
    isGlobal: boolean;
    values: ProductAttributeValueItem[];
}

//------Tạo các biến thể---
/**
 * Payload từng variant gửi lên trong FormData (variantsPayload)
 * fileKey KHÔNG phải image, chỉ là cách để FE match với file upload.
 */
export interface ProductVariantBulkItem {
  variantKey: string;                      // ví dụ: "2|2"
  attributes: VariantAttributePair[];      // danh sách attribute-value
  stock?: number;                           // default = 0
  priceAdjustment?: number;                 // default = 0
  fileKey?: string;                         // key ảnh trong FormData (nếu có)
}

/**
 * Payload FormData gửi lên API bulk create
 *    FE sẽ build:
 *      - "productId": string
 *      - "variantsPayload": JSON string của ProductVariantBulkItem[]
 *      - kèm file(s) nếu có (key trùng với fileKey)
 */
export interface CreateProductVariantsBulkRequest {
    productId: string;
    variantsPayload: ProductVariantBulkItem[];
    // các file upload: key trùng với `fileKey` trong variantsPayload
}

//-----Cập nhật 1 biến thể-----
/**
 * Payload gửi lên API để cập nhật 1 biến thể
 * - stock, priceAdjustment optional
 * - image:
 *    - undefined = giữ nguyên ảnh
 *    - "" = xóa ảnh
 *    - file upload = mới upload, FE sẽ dùng FormData
 */
export interface UpdateProductVariantRequest {
    stock?: number;
    priceAdjustment?: number;
    image?: string | ""; // "" để xóa, undefined giữ nguyên
}
