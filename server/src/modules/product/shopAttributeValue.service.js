// server/src/modules/product/shopAttributeValue.service.js
import ShopAttributeValue from "./shopAttributeValue.model.js";
import AttributeValue from "./attributeValue.model.js";
import mongoose from "mongoose";

const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? mongoose.Types.ObjectId(id) : null);

/**
 * Lấy danh sách overrides (lọc theo shopId, attributeId optional)
 * query: { shopId, attributeId, page, limit }
 */
export const getShopOverrides = async ({ shopId, attributeId, page = 1, limit = 50 }) => {
  try {
    if (!shopId || !toObjectId(shopId)) throw new Error("shopId không hợp lệ");
    const skip = (Math.max(1, page) - 1) * limit;

    const filter = { shopId };
    if (attributeId && toObjectId(attributeId)) {
      // Need to find attributeValueIds for this attribute
      const vals = await AttributeValue.find({ attributeId }).select("_id").lean();
      const ids = vals.map((v) => v._id);
      filter.attributeValueId = { $in: ids };
    }

    const items = await ShopAttributeValue.find(filter).skip(skip).limit(limit).lean();
    const total = await ShopAttributeValue.countDocuments(filter);
    return { success: true, message: "Lấy overrides thành công", data: { items, total, page, limit } };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getShopOverrideById = async (id) => {
  try {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");
    const item = await ShopAttributeValue.findById(id).lean();
    if (!item) throw new Error("Không tìm thấy override");
    return { success: true, message: "Lấy override thành công", data: item };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getOverridesByShop = async (shopId) => {
  try {
    if (!shopId || !toObjectId(shopId)) throw new Error("shopId không hợp lệ");
    const items = await ShopAttributeValue.find({ shopId, isActive: { $ne: false } }).lean();
    return { success: true, message: "Lấy overrides của shop thành công", data: items };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getOverrideByValueId = async (attributeValueId, shopId) => {
  try {
    if (!attributeValueId || !toObjectId(attributeValueId)) throw new Error("attributeValueId không hợp lệ");
    if (!shopId || !toObjectId(shopId)) throw new Error("shopId không hợp lệ");
    const item = await ShopAttributeValue.findOne({ attributeValueId, shopId }).lean();
    return { success: true, message: "Lấy override theo value thành công", data: item || null };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Tạo hoặc ghi đè 1 ShopAttributeValue
 * body: { shopId, attributeValueId, customValue?, customImage?, customPriceAdjustment?, isActive? }
 */
export const createOrUpdateShopOverride = async (body) => {
  try {
    const { shopId, attributeValueId } = body;
    if (!shopId || !toObjectId(shopId)) throw new Error("shopId không hợp lệ");
    if (!attributeValueId || !toObjectId(attributeValueId)) throw new Error("attributeValueId không hợp lệ");

    const existing = await ShopAttributeValue.findOne({ shopId, attributeValueId });
    if (existing) {
      // update existing
      existing.customValue = body.customValue ?? existing.customValue;
      existing.customImage = body.customImage ?? existing.customImage;
      existing.customPriceAdjustment = body.customPriceAdjustment ?? existing.customPriceAdjustment;
      if (body.isActive !== undefined) existing.isActive = body.isActive;
      await existing.save();
      return { success: true, message: "Cập nhật ghi đè thành công", data: existing };
    } else {
      const created = await ShopAttributeValue.create({
        shopId,
        attributeValueId,
        customValue: body.customValue || "",
        customImage: body.customImage || "",
        customPriceAdjustment: body.customPriceAdjustment,
        isActive: body.isActive !== undefined ? body.isActive : true,
      });
      return { success: true, message: "Tạo ghi đè thành công", data: created };
    }
  } catch (error) {
    if (error.code === 11000) return { success: false, message: "Override đã tồn tại" };
    return { success: false, message: error.message };
  }
};

export const updateShopOverride = async (id, body) => {
  try {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");
    const item = await ShopAttributeValue.findById(id);
    if (!item) throw new Error("Không tìm thấy override");

    if (body.customValue !== undefined) item.customValue = body.customValue;
    if (body.customImage !== undefined) item.customImage = body.customImage;
    if (body.customPriceAdjustment !== undefined) item.customPriceAdjustment = body.customPriceAdjustment;
    if (body.isActive !== undefined) item.isActive = body.isActive;

    await item.save();
    return { success: true, message: "Cập nhật override thành công", data: item };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteShopOverride = async (id) => {
  try {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");
    const item = await ShopAttributeValue.findByIdAndDelete(id);
    if (!item) throw new Error("Không tìm thấy override để xóa");
    return { success: true, message: "Xóa override thành công" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const toggleShopOverrideActive = async (id) => {
  try {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");
    const item = await ShopAttributeValue.findById(id);
    if (!item) throw new Error("Không tìm thấy override");
    item.isActive = item.isActive === false ? true : false;
    await item.save();
    return { success: true, message: "Cập nhật trạng thái override thành công", data: item };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
