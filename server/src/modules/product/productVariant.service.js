// server/src/modules/product/productVariant.service.js
import mongoose from "mongoose";
import ProductVariant from "./productVariant.model.js";
import Product from "./product.model.js";
import Attribute from "./attribute.model.js";
import AttributeValue from "./attributeValue.model.js";
import ShopAttributeValue from "./shopAttributeValue.model.js";
import { generateVariantKey } from "../../utils/generateVariantKey.js";

const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? mongoose.Types.ObjectId(id) : null);

/**
 * Helper: build populated variant similar to product.service
 */
const buildPopulatedVariant = async (variant) => {
  const v = variant.toObject ? variant.toObject() : variant;
  await Product.populate(v, { path: "productId", select: "pdName basePrice shopId images isActive" });
  await ProductVariant.populate(v, [
    { path: "attributes.attributeId", model: "Attribute" },
    { path: "attributes.valueId", model: "AttributeValue" },
  ]);
  const product = v.productId;
  const shopId = product?.shopId;
  // compute price
  let total = product?.basePrice ?? 0;
  for (const a of v.attributes) {
    const valDoc = a.valueId;
    const override = await ShopAttributeValue.findOne({ shopId, attributeValueId: valDoc._id }).lean();
    const adj = override?.customPriceAdjustment ?? valDoc.priceAdjustment ?? 0;
    total += adj;
  }
  v.calculatedPrice = total;

  v.attributes = v.attributes.map((a) => {
    const attr = a.attributeId;
    const val = a.valueId;
    return {
      attributeId: attr?._id,
      attributeLabel: attr?.label,
      valueId: val?._id,
      value: val?.value,
    };
  });

  return v;
};

export const getVariantsByProduct = async (productId) => {
  try {
    if (!toObjectId(productId)) throw new Error("productId không hợp lệ");
    const variants = await ProductVariant.find({ productId }).lean();
    const populated = await Promise.all(variants.map((v) => buildPopulatedVariant(v)));
    return { success: true, message: "Lấy variants thành công", data: populated };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getVariantById = async (id) => {
  try {
    if (!toObjectId(id)) throw new Error("id không hợp lệ");
    const variant = await ProductVariant.findById(id);
    if (!variant) throw new Error("Không tìm thấy variant");
    const populated = await buildPopulatedVariant(variant);
    return { success: true, message: "Lấy variant thành công", data: populated };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Create a single variant for a product
 * payload: { productId, attributes: [{ attributeId, valueId }], stock?, images? }
 */
export const createVariant = async (payload) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { productId, attributes = [], stock = 0, images = [] } = payload;
    if (!productId || !toObjectId(productId)) throw new Error("productId không hợp lệ");
    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error("Không tìm thấy product");

    // validate attributes exist and belong to proper attribute
    for (const a of attributes) {
      if (!toObjectId(a.attributeId) || !toObjectId(a.valueId)) throw new Error("attributeId hoặc valueId không hợp lệ");
      const val = await AttributeValue.findById(a.valueId).session(session);
      if (!val) throw new Error(`Không tìm thấy AttributeValue ${a.valueId}`);
      if (String(val.attributeId) !== String(a.attributeId)) throw new Error("valueId không thuộc attributeId tương ứng");
    }

    // generate variantKey
    const key = await generateVariantKey(attributes);

    // check unique
    const exists = await ProductVariant.findOne({ productId, variantKey: key }).session(session);
    if (exists) throw new Error("Variant đã tồn tại");

    const created = await ProductVariant.create([{
      productId,
      variantKey: key,
      attributes,
      stock,
      images,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const populated = await buildPopulatedVariant(created[0]);
    return { success: true, message: "Tạo variant thành công", data: populated };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return { success: false, message: error.message };
  }
};

export const updateVariant = async (id, body) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!toObjectId(id)) throw new Error("id không hợp lệ");
    const variant = await ProductVariant.findById(id).session(session);
    if (!variant) throw new Error("Không tìm thấy variant");

    // allow updating attributes (careful to regenerate variantKey), stock, images
    if (body.attributes) {
      // validate and set
      for (const a of body.attributes) {
        if (!toObjectId(a.attributeId) || !toObjectId(a.valueId)) throw new Error("attributeId hoặc valueId không hợp lệ");
        const val = await AttributeValue.findById(a.valueId).session(session);
        if (!val) throw new Error(`Không tìm thấy AttributeValue ${a.valueId}`);
        if (String(val.attributeId) !== String(a.attributeId)) throw new Error("valueId không thuộc attributeId tương ứng");
      }
      const newKey = await generateVariantKey(body.attributes);
      // ensure uniqueness
      const other = await ProductVariant.findOne({ productId: variant.productId, variantKey: newKey, _id: { $ne: variant._id } }).session(session);
      if (other) throw new Error("Một variant với tổ hợp thuộc tính này đã tồn tại");
      variant.attributes = body.attributes;
      variant.variantKey = newKey;
    }
    if (body.stock !== undefined) variant.stock = body.stock;
    if (body.images !== undefined) variant.images = body.images;

    await variant.save({ session });
    await session.commitTransaction();
    session.endSession();

    const populated = await buildPopulatedVariant(variant);
    return { success: true, message: "Cập nhật variant thành công", data: populated };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return { success: false, message: error.message };
  }
};

export const deleteVariant = async (id) => {
  try {
    if (!toObjectId(id)) throw new Error("id không hợp lệ");
    const v = await ProductVariant.findByIdAndDelete(id);
    if (!v) throw new Error("Không tìm thấy variant để xóa");
    return { success: true, message: "Xóa variant thành công" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateVariantStock = async (id, deltaOrValue, mode = "set") => {
  // mode: "set" or "inc" or "dec"
  try {
    if (!toObjectId(id)) throw new Error("id không hợp lệ");
    const v = await ProductVariant.findById(id);
    if (!v) throw new Error("Không tìm thấy variant");
    if (mode === "set") v.stock = deltaOrValue;
    else if (mode === "inc") v.stock = v.stock + Math.abs(Number(deltaOrValue));
    else if (mode === "dec") v.stock = Math.max(0, v.stock - Math.abs(Number(deltaOrValue)));
    await v.save();
    const populated = await buildPopulatedVariant(v);
    return { success: true, message: "Cập nhật tồn kho thành công", data: populated };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getAvailableVariants = async (productId) => {
  try {
    if (!toObjectId(productId)) throw new Error("productId không hợp lệ");
    const vals = await ProductVariant.find({ productId, stock: { $gt: 0 } }).lean();
    const populated = await Promise.all(vals.map((v) => buildPopulatedVariant(v)));
    return { success: true, message: "Lấy variants còn hàng thành công", data: populated };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getLowStockVariants = async (shopId, threshold = 5) => {
  try {
    if (!toObjectId(shopId)) throw new Error("shopId không hợp lệ");
    // get products of shop
    const prods = await Product.find({ shopId }).select("_id").lean();
    const pids = prods.map((p) => p._id);
    const vals = await ProductVariant.find({ productId: { $in: pids }, stock: { $lt: threshold } }).lean();
    const populated = await Promise.all(vals.map((v) => buildPopulatedVariant(v)));
    return { success: true, message: "Lấy variants tồn kho thấp thành công", data: populated };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
