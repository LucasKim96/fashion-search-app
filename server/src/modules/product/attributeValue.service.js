import AttributeValue from "./attributeValue.model.js";
import Attribute from "./attribute.model.js";
import mongoose from "mongoose";

const toObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

/**
 * Lấy danh sách giá trị theo attributeId hoặc shop
 * Query: ?attributeId=&shopId=&page=&limit=
 */
export const getValues = async ({ attributeId, shopId, page = 1, limit = 50 }) => {
  try {
    const filter = {};
    if (attributeId && toObjectId(attributeId)) filter.attributeId = attributeId;
    if (shopId && toObjectId(shopId)) filter.shopId = shopId;

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      AttributeValue.find(filter).skip(skip).limit(limit).lean(),
      AttributeValue.countDocuments(filter),
    ]);

    return {
      success: true,
      message: "Lấy danh sách giá trị thuộc tính thành công!",
      data: { items, total, page, limit },
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Lấy danh sách giá trị toàn cục (attribute.global = true)
 */
export const getGlobalValues = async () => {
  try {
    const globalAttributes = await Attribute.find({ isGlobal: true }, "_id");
    const ids = globalAttributes.map((a) => a._id);

    const values = await AttributeValue.find({ attributeId: { $in: ids } }).lean();

    return {
      success: true,
      message: "Lấy danh sách giá trị toàn cục thành công!",
      data: values,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Lấy chi tiết 1 giá trị
 */
export const getValueById = async (id) => {
  try {
    if (!toObjectId(id)) throw new Error("ID không hợp lệ!");
    const val = await AttributeValue.findById(id)
      .populate("attributeId", "label isGlobal")
      .lean();
    if (!val) throw new Error("Không tìm thấy giá trị thuộc tính!");
    return { success: true, message: "Lấy chi tiết giá trị thành công!", data: val };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Tạo 1 hoặc nhiều giá trị mới cho attribute
 * body: { attributeId, values: [ { value, priceAdjustment, image, shopId? } ] }
 */
export const createValues = async (body) => {
  try {
    const { attributeId, values } = body;
    if (!attributeId || !toObjectId(attributeId)) throw new Error("attributeId không hợp lệ!");

    const attribute = await Attribute.findById(attributeId);
    if (!attribute) throw new Error("Thuộc tính không tồn tại!");

    if (!Array.isArray(values) || !values.length)
      throw new Error("Không có giá trị nào để tạo!");

    const docs = values.map((v) => ({
      attributeId,
      value: v.value?.trim(),
      image: v.image || "",
      priceAdjustment: v.priceAdjustment ?? 0,
      shopId: v.shopId || null,
    }));

    const inserted = await AttributeValue.insertMany(docs);
    return {
      success: true,
      message: "Tạo giá trị thuộc tính thành công!",
      data: inserted,
    };
  } catch (error) {
    if (error.code === 11000)
      return { success: false, message: "Một hoặc nhiều giá trị bị trùng!" };
    return { success: false, message: error.message };
  }
};

/**
 * Cập nhật giá trị
 */
export const updateValue = async (id, body) => {
  try {
    if (!toObjectId(id)) throw new Error("ID không hợp lệ!");

    const update = {};
    ["value", "image", "priceAdjustment", "shopId"].forEach((key) => {
      if (body[key] !== undefined) update[key] = body[key];
    });

    const updated = await AttributeValue.findByIdAndUpdate(id, update, { new: true });
    if (!updated) throw new Error("Không tìm thấy giá trị để cập nhật!");

    return {
      success: true,
      message: "Cập nhật giá trị thành công!",
      data: updated,
    };
  } catch (error) {
    if (error.code === 11000)
      return { success: false, message: "Giá trị bị trùng lặp!" };
    return { success: false, message: error.message };
  }
};

/**
 * Lấy tất cả giá trị theo attributeId
 */
export const getValuesByAttribute = async (attributeId) => {
  try {
    if (!attributeId || !toObjectId(attributeId)) throw new Error("attributeId không hợp lệ!");
    const list = await AttributeValue.find({ attributeId }).lean();
    return {
      success: true,
      message: "Lấy danh sách giá trị của thuộc tính thành công!",
      data: list,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Bật / tắt hoạt động của giá trị
 */
export const toggleValueActive = async (id) => {
  try {
    if (!toObjectId(id)) throw new Error("ID không hợp lệ!");
    const value = await AttributeValue.findById(id);
    if (!value) throw new Error("Không tìm thấy giá trị!");

    value.isActive = value.isActive === false ? true : false;
    await value.save();

    return {
      success: true,
      message: `Giá trị đã được ${value.isActive ? "bật" : "tắt"} hoạt động!`,
      data: value,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
