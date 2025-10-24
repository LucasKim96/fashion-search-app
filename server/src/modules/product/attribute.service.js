import mongoose from "mongoose";
import Attribute from "./attribute.model.js";
import AttributeValue from "./attributeValue.model.js";
import ShopAttributeValue from "./shopAttributeValue.model.js";

// === Helper ======================================================
const toObjectId = (id) => {
  if (!id) return null;
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    return null;
  }
};

// Validate attribute value data
const validateAttributeValue = (value) => {
  if (!value || typeof value !== 'object') {
    throw new Error("Giá trị attribute không hợp lệ");
  }
  if (!value.value || value.value.trim() === '') {
    throw new Error("Giá trị attribute không được để trống");
  }
  if (value.priceAdjustment !== undefined && typeof value.priceAdjustment !== 'number') {
    throw new Error("priceAdjustment phải là số");
  }
  return true;
};

// Lấy attribute + values (raw)
const _fetchAttributeWithValues = async (attributeId) => {
  try {
    const attribute = await Attribute.findById(attributeId).lean();
    if (!attribute) return null;

    const values = await AttributeValue.find({
      attributeId: attribute._id,
      isActive: { $ne: false },
    }).lean();

    attribute.values = values;
    return attribute;
  } catch (error) {
    console.error('Error fetching attribute with values:', error);
    return null;
  }
};

// Merge global AttributeValue với ShopAttributeValue override
const _mergeValuesWithShopOverrides = (values, shopOverrides = []) => {
  const overridesMap = new Map();
  for (const o of shopOverrides) overridesMap.set(String(o.attributeValueId), o);

  return values.map((v) => {
    const ov = overridesMap.get(String(v._id));
    return {
      _id: v._id,
      value: ov?.customValue ?? v.value,
      image: ov?.customImage ?? v.image ?? null,
      priceAdjustment: ov?.customPriceAdjustment ?? v.priceAdjustment ?? 0,
      isOverridden: !!ov,
      original: v,
    };
  });
};


export const getAttributes = async ({ isGlobal, shopId, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' }) => {
  try {
    const filter = {};
    if (typeof isGlobal === "boolean") filter.isGlobal = isGlobal;
    if (shopId) filter.shopId = shopId;

    // Giới hạn phân trang an toàn
    const maxLimit = 100;
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), maxLimit);
    const skip = (safePage - 1) * safeLimit;

    // Validate sort parameters
    const allowedSortFields = ['createdAt', 'updatedAt', 'label'];
    const allowedSortOrders = ['asc', 'desc'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = allowedSortOrders.includes(sortOrder) ? sortOrder : 'desc';
    const sort = { [validSortBy]: validSortOrder === 'desc' ? -1 : 1 };

    const [items, total] = await Promise.all([
      Attribute.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Attribute.countDocuments(filter),
    ]);

    return {
      success: true,
      message: "Lấy danh sách thuộc tính thành công!",
      data: {
        items,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};



// Lấy chi tiết attribute
export const getAttributeById = async (id) => {
  try {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");
    const attribute = await _fetchAttributeWithValues(id);
    if (!attribute) throw new Error("Không tìm thấy thuộc tính");
    return { success: true, message: "Lấy thuộc tính thành công", data: attribute };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Tạo attribute + values
export const createAttribute = async (payload) => {
  try {
    const { label, isGlobal = false, shopId = null, values = [] } = payload;
    if (!label || label.trim() === '') throw new Error("Thiếu label attribute");

    // Validate values before creating
    if (Array.isArray(values) && values.length) {
      for (const v of values) {
        validateAttributeValue(v);
      }
    }

    const attribute = await Attribute.create({ 
      label: label.trim(), 
      isGlobal, 
      shopId: shopId ? toObjectId(shopId) : null 
    });

    if (Array.isArray(values) && values.length) {
      const docs = values.map((v) => ({
        attributeId: attribute._id,
        value: v.value.trim(),
        image: v.image || "",
        priceAdjustment: v.priceAdjustment ?? 0,
        shopId: v.shopId ? toObjectId(v.shopId) : null,
      }));
      await AttributeValue.insertMany(docs);
    }

    const result = await _fetchAttributeWithValues(attribute._id);
    return { success: true, message: "Tạo thuộc tính thành công!", data: result };
  } catch (error) {
    if (error.code === 11000)
      return { success: false, message: "Thuộc tính hoặc value đã tồn tại" };
    return { success: false, message: error.message };
  }
};

// Cập nhật attribute + value
export const updateAttribute = async (id, body) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");
    const attribute = await Attribute.findById(id).session(session);
    if (!attribute) throw new Error("Không tìm thấy attribute");

    const { label, isGlobal, shopId, values } = body;
    if (label !== undefined) {
      if (!label || label.trim() === '') throw new Error("Label không được để trống");
      attribute.label = label.trim();
    }
    if (isGlobal !== undefined) attribute.isGlobal = isGlobal;
    if (shopId !== undefined) attribute.shopId = shopId ? toObjectId(shopId) : null;
    await attribute.save({ session });

    if (Array.isArray(values)) {
      for (const v of values) {
        if (v._action === "delete" && v._id) {
          await AttributeValue.findByIdAndDelete(v._id).session(session);
        } else if (v._id) {
          // Validate before update
          validateAttributeValue(v);
          await AttributeValue.findByIdAndUpdate(
            v._id,
            {
              value: v.value.trim(),
              priceAdjustment: v.priceAdjustment ?? 0,
              image: v.image ?? undefined,
              shopId: v.shopId ? toObjectId(v.shopId) : undefined,
            },
            { session }
          );
        } else {
          // Validate before create
          validateAttributeValue(v);
          await AttributeValue.create(
            [
              {
                attributeId: attribute._id,
                value: v.value.trim(),
                image: v.image || "",
                priceAdjustment: v.priceAdjustment ?? 0,
                shopId: v.shopId ? toObjectId(v.shopId) : null,
              },
            ],
            { session }
          );
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    const updated = await _fetchAttributeWithValues(id);
    return { success: true, message: "Cập nhật thuộc tính thành công", data: updated };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (error.code === 11000)
      return { success: false, message: "Trùng tên hoặc giá trị" };
    return { success: false, message: error.message };
  }
};

// Xóa attribute + value
export const deleteAttribute = async (id) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");
    const attribute = await Attribute.findById(id).session(session);
    if (!attribute) throw new Error("Không tìm thấy attribute");

    await AttributeValue.deleteMany({ attributeId: attribute._id }).session(session);
    await Attribute.findByIdAndDelete(attribute._id).session(session);

    await session.commitTransaction();
    session.endSession();
    return { success: true, message: "Xóa thuộc tính và giá trị liên quan thành công" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return { success: false, message: error.message };
  }
};

// Lấy toàn bộ attribute cho shop (merge global + local + override)
export const getAttributesForShopFull = async (shopId) => {
  try {
    const globalAttrs = await Attribute.find({ isGlobal: true }).lean();
    const localAttrs = await Attribute.find({ shopId }).lean();
    const allAttrs = [...globalAttrs, ...localAttrs];

    const attrIds = allAttrs.map((a) => a._id);
    const allValues = await AttributeValue.find({
      attributeId: { $in: attrIds },
      isActive: { $ne: false },
    }).lean();

    const valueIds = allValues.map((v) => v._id);
    const overrides = await ShopAttributeValue.find({
      shopId,
      attributeValueId: { $in: valueIds },
      isActive: { $ne: false },
    }).lean();

    const valuesByAttr = new Map();
    for (const v of allValues) {
      const arr = valuesByAttr.get(String(v.attributeId)) || [];
      arr.push(v);
      valuesByAttr.set(String(v.attributeId), arr);
    }

    const result = allAttrs.map((a) => {
      const vals = valuesByAttr.get(String(a._id)) || [];
      const merged = _mergeValuesWithShopOverrides(vals, overrides);
      return { ...a, values: merged };
    });

    return { success: true, message: "Lấy attributes (full) thành công", data: result };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Tìm kiếm attributes theo tên
export const searchAttributes = async ({ query, isGlobal, shopId, page = 1, limit = 20 }) => {
  try {
    const filter = {};
    if (typeof isGlobal === "boolean") filter.isGlobal = isGlobal;
    if (shopId) filter.shopId = shopId;
    if (query && query.trim()) {
      filter.label = { $regex: query.trim(), $options: 'i' };
    }

    const maxLimit = 100;
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), maxLimit);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      Attribute.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Attribute.countDocuments(filter),
    ]);

    return {
      success: true,
      message: "Tìm kiếm thuộc tính thành công!",
      data: {
        items,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
        query: query?.trim() || '',
      },
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
