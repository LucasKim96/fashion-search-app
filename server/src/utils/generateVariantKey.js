import AttributeValue from "../modules/product/attributeValue.model.js";

export const generateVariantKey = async (attributes) => {
  // attributes: [{ attributeId, valueId }, ...]
  // Lấy tên value cho từng valueId
  const values = await Promise.all(
    attributes.map(async (a) => {
      const val = await AttributeValue.findById(a.valueId).select("value");
      return val?.value || "";
    })
  );
  // Sắp xếp để tránh trùng ngẫu nhiên (M|Red giống Red|M)
  const sorted = values.sort((a, b) => a.localeCompare(b));
  return sorted.join("|");
};
