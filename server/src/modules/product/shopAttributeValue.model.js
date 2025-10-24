import mongoose from "mongoose";

const shopAttributeValueSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  attributeValueId: { type: mongoose.Schema.Types.ObjectId, ref: "AttributeValue", required: true },
  // Ghi đè các trường cần tùy chỉnh
  customValue: { type: String, default: "" },
  customImage: { type: String, default: "" },
  customPriceAdjustment: { type: Number }, // có thể khác giá hệ thống
  // Nếu shop muốn ẩn giá trị này đi (không dùng nữa)
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

shopAttributeValueSchema.index({ shopId: 1, attributeValueId: 1 }, { unique: true });
export default mongoose.model("ShopAttributeValue", shopAttributeValueSchema);
// Đây chính là bảng override cho phép:
// mỗi shop có ảnh/giá riêng cho giá trị dùng chung,
// hoặc ẩn một giá trị không muốn dùng.
// cần logic xử lý giá trị ghi đè để để lưu đúng vào productVariant