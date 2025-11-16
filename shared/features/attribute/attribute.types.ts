import { AttributeValue } from "./attributeValue.types"
/**
 * Attribute trong DB.
 * BE trả về dạng raw: không populate shopId.
 */
export interface Attribute {
    _id: string;
    label: string;               // "Color", "Size"
    isGlobal: boolean;           // nếu true => shopId = null
    shopId: string | null;         // shop tạo riêng
    isActive: boolean;
    createdAt: string;
    updatedAt: string;

    values?: AttributeValue[];
}

//--------Tạo attribute + value----------
/**
 * Một item giá trị gửi lên khi tạo attribute.
 * fileKey KHÔNG phải image, chỉ là cách để FE match với file upload.
 */
export interface CreateAttributeValueItem {
    value: string;      // Giá trị của attribute, ví dụ: "Red", "M"
    fileKey?: string;     // key dùng để match file upload trong form-data vd "file-0" "file-1"
}
/**
 * Payload gửi lên API khi tạo Attribute.
 * FE phải đưa `values` vào form-data dưới dạng JSON string.
 */
export interface CreateAttributeRequest {
    label: string;
    values: CreateAttributeValueItem[];
}
// Response BE trả về khi CreateAttribute
export interface AttributeWithValues extends Attribute {
    values: AttributeValue[];
}

//--------Cập nhật attribute---------
// Payload gửi lên API khi cập nhật label Attribute
export interface UpdateAttributeLabelRequest {
    label: string;
}

//--------Tìm kiếm attribute---------
export interface SearchAttributesParams {
    query?: string;
    page?: number;
    limit?: number;
}
export interface PaginatedAttributes {
    attributes: Attribute[];  // danh sách attribute raw
    total: number;       // tổng số kết quả
    page: number;        // trang hiện tại
    limit: number;       // limit per page
    totalPages: number;  // tổng số trang
    query: string;       // query search
}

//--------Lấy attribute---------
export interface GetAttributesFlexibleParams {
    page?: number;                // trang hiện tại, default 1
    limit?: number;               // số item/trang, default 20
    sortBy?: "createdAt" | "updatedAt" | "label"; // trường sort, default "createdAt"
    sortOrder?: "asc" | "desc";   // default "desc"
    includeInactive?: boolean;    // có lấy cả isActive=false không, default false
}
export interface GetAttributeByIdParams {
    id: string;
}

/** Pagination result */
export interface FlexibleAttributesData {
    attributes: Attribute[];  
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}