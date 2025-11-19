import { CreateAttributeValueItem } from "./attribute.types"
/**
 * AttributeValue trong DB, raw result.
 * BE không populate attributeId hoặc shopId.
 */
export interface AttributeValue {
    _id: string;
    attributeId: string;     // ObjectId
    value: string;               // "Red", "XL"
    shopId: string | null;         // ObjectId hoặc null
    image: string;               // "/uploads/attributes/xxx.png" hoặc ""
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
//-------Tạo 1 hoặc nhiều value cho 1 attribute

// Payload gửi API (Shop & Admin đều dùng)
/**
 * Payload gửi lên API để tạo nhiều value cho 1 attribute
 * FE gửi dưới dạng JSON string trong form-data.
 */
export interface CreateAttributeValuesRequest {
    values: CreateAttributeValueItem[];
}

//---------Cập nhật 1 value của attribute-------
/**
 * Payload gửi lên API PATCH /attribute-values/:valueId
 * FE có thể chỉ update value hoặc ảnh hoặc xóa ảnh.
 */
export interface UpdateAttributeValueRequest {
  value?: string;       // optional, nếu muốn đổi tên
  image?: string | "";  // optional, "" = xóa ảnh, undefined = giữ nguyên
}

