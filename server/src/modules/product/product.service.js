// server/src/modules/product/product.service.js
import mongoose from "mongoose";
import Product from "./product.model.js";
import ProductVariant from "./productVariant.model.js";
import Attribute from "./attribute.model.js";
import AttributeValue from "./attributeValue.model.js";
import ShopAttributeValue from "./shopAttributeValue.model.js";
import { generateVariantKey } from "../../utils/generateVariantKey.js";

const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? mongoose.Types.ObjectId(id) : null);

/**
 * Helper: compute effective price for a variant
 * - attributes: [{ attributeId, valueId }]
 * - basePrice: number
 * - shopId: shop of the product (to check overrides)
 */
const computeVariantPrice = async (attributes, basePrice, shopId) => {
  try {
    let total = basePrice || 0;
    for (const a of attributes) {
      const val = await AttributeValue.findById(a.valueId).lean();
      if (!val) continue;
      // check override
      const ov = await ShopAttributeValue.findOne({ shopId, attributeValueId: val._id }).lean();
      const adj = ov?.customPriceAdjustment ?? val.priceAdjustment ?? 0;
      total += adj;
    }
    return total;
  } catch (err) {
    throw err;
  }
};

/**
 * Helper: build populated variant object with computed price and merged override info
 */
const buildPopulatedVariant = async (variant) => {
  // variant is a ProductVariant doc (or plain object)
  const v = variant.toObject ? variant.toObject() : variant;
  await Product.populate(v, { path: "productId", select: "pdName basePrice shopId images isActive" });

  // populate attributes value and attribute
  await ProductVariant.populate(v, [
    { path: "attributes.attributeId", model: "Attribute" },
    { path: "attributes.valueId", model: "AttributeValue" },
  ]);

  const product = v.productId;
  const shopId = product?.shopId;

  // compute price
  const price = await computeVariantPrice(v.attributes, product?.basePrice ?? 0, shopId);
  v.calculatedPrice = price;

  // attach display names and check overrides
  v.attributes = await Promise.all(
    v.attributes.map(async (a) => {
      const valueDoc = a.valueId || (await AttributeValue.findById(a.valueId).lean());
      const attrDoc = a.attributeId || (await Attribute.findById(a.attributeId).lean());
      const override = await ShopAttributeValue.findOne({ shopId, attributeValueId: valueDoc._id }).lean();
      return {
        attributeId: attrDoc?._id,
        attributeLabel: attrDoc?.label ?? null,
        valueId: valueDoc?._id,
        value: override?.customValue ?? valueDoc?.value,
        valueOriginal: valueDoc?.value,
        override: !!override,
        overrideData: override || null,
      };
    })
  );

  return v;
};

/* ============================
   Product Service Functions
   ============================ */

export const getProductsFull = async ({ page = 1, limit = 20, filter = {} }) => {
  try {
    const skip = (Math.max(1, page) - 1) * limit;
    const q = { ...filter };
    const total = await Product.countDocuments(q);
    const products = await Product.find(q).skip(skip).limit(limit).lean();

    // For each product, populate variants + merged attributes
    const items = [];
    for (const p of products) {
      const variants = await ProductVariant.find({ productId: p._id }).lean();
      // populate attributes & values & overrides per variant
      const populated = await Promise.all(variants.map((v) => buildPopulatedVariant(v)));
      items.push({ ...p, variants: populated });
    }

    return { success: true, message: "Lấy danh sách sản phẩm (full) thành công", data: { items, total, page, limit } };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getProductByIdFull = async (id) => {
  try {
    if (!toObjectId(id)) throw new Error("Id sản phẩm không hợp lệ");
    const product = await Product.findById(id).lean();
    if (!product) throw new Error("Không tìm thấy sản phẩm");

    const variants = await ProductVariant.find({ productId: id }).lean();
    const populated = await Promise.all(variants.map((v) => buildPopulatedVariant(v)));

    // also include merged attributes for product's shop (use Attribute/AttributeValue/ShopAttributeValue)
    const attrIds = await Attribute.find({ $or: [{ isGlobal: true }, { shopId: product.shopId }] }).select("_id").lean();
    // but better to rely on attributeService.getAttributesForShopFull if exists. Here simplify:
    // We'll fetch attributes that have values related to this product's variants (practical)
    const valueIds = [];
    populated.forEach((pv) => pv.attributes.forEach((a) => valueIds.push(a.valueId)));
    const distinctAttrIds = [...new Set(valueIds.map((v) => String(v)))];

    return { success: true, message: "Lấy sản phẩm thành công", data: { product, variants: populated } };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Generate Cartesian product of arrays of arrays
 * e.g. [[a,b],[1,2]] -> [[a,1],[a,2],[b,1],[b,2]]
 */
const cartesianProduct = (arrays) => {
  if (!arrays.length) return [];
  return arrays.reduce((acc, curr) => {
    const res = [];
    acc.forEach((a) => {
      curr.forEach((c) => {
        res.push(a.concat([c]));
      });
    });
    return res;
  }, [[]]);
};

/**
 * Generate variants for a product from given attribute value lists
 * attributesList: [{ attributeId, values: [{ valueId, ... }] }, ...]
 */
export const generateVariantsForProduct = async (productId, attributesList = []) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!toObjectId(productId)) throw new Error("productId không hợp lệ");
    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error("Không tìm thấy product");

    // prepare arrays of valueId arrays
    const arrays = attributesList.map((a) => a.values.map((v) => ({ attributeId: a.attributeId, valueId: v.valueId })));
    // cartesian product -> each combo is array of {attributeId, valueId}
    const combos = cartesianProduct(arrays);

    const created = [];
    for (const combo of combos) {
      // generate variantKey (call helper with attributes)
      const key = await generateVariantKey(combo);
      // ensure uniqueness per product
      const exists = await ProductVariant.findOne({ productId, variantKey: key }).session(session);
      if (exists) {
        created.push({ existing: true, variant: exists });
        continue;
      }
      const v = await ProductVariant.create([{
        productId,
        variantKey: key,
        attributes: combo,
        stock: 0,
        images: [],
      }], { session });
      created.push({ existing: false, variant: v[0] });
    }

    await session.commitTransaction();
    session.endSession();

    // return populated variants
    const result = await Promise.all(created.map(async (c) => ({ existing: c.existing, variant: await buildPopulatedVariant(c.variant) })));
    return { success: true, message: "Sinh variants thành công", data: result };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return { success: false, message: error.message };
  }
};

/**
 * Full-create product: create product + attributes/values (TH1-TH4) + optionally generate variants
 * Payload as described in your spec.
 */
export const fullCreateProduct = async (payload) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      pdName,
      basePrice,
      description,
      images = [],
      shopId,
      attributes = [],
      autoGenerateVariants = true,
    } = payload;

    if (!pdName) throw new Error("Thiếu tên sản phẩm");
    if (!shopId || !toObjectId(shopId)) throw new Error("shopId không hợp lệ");

    // 1) create product
    const product = await Product.create([{
      pdName,
      basePrice,
      description: description || "",
      images,
      shopId,
    }], { session });
    const createdProduct = product[0];

    // 2) process each attribute (TH1-TH4)
    // We'll build a list attributesList = [{ attributeId, values: [{ valueId, value }] }, ...]
    const attributesList = [];

    for (const attr of attributes) {
      const mode = attr.mode; // "create" | "use_global" | "use_global_and_add_shop_values"
      let attributeDoc = null;

      if (mode === "create") {
        // create attribute under this shop
        const a = await Attribute.create([{ label: attr.label, isGlobal: false, shopId }], { session });
        attributeDoc = a[0];
      } else if (mode === "use_global" || mode === "use_global_and_add_shop_values") {
        // expect attributeId provided
        if (!attr.attributeId) throw new Error(`Thiếu attributeId cho ${attr.label}`);
        attributeDoc = await Attribute.findById(attr.attributeId).session(session);
        if (!attributeDoc) throw new Error(`Attribute ${attr.attributeId} không tồn tại`);
      } else {
        // fallback: if attributeId provided, use it; else create
        if (attr.attributeId) {
          attributeDoc = await Attribute.findById(attr.attributeId).session(session);
          if (!attributeDoc) throw new Error(`Attribute ${attr.attributeId} không tồn tại`);
        } else {
          const a = await Attribute.create([{ label: attr.label, isGlobal: false, shopId }], { session });
          attributeDoc = a[0];
        }
      }

      // now process values array
      const valuesOut = [];
      for (const v of attr.values || []) {
        // three possible v.mode values:
        // - "use_global": use existing valueId required
        // - "create_shop": create new AttributeValue with shopId
        // - unspecified -> if v.valueId exists, use it; else create new shop value
        if (v.mode === "use_global") {
          if (!v.valueId) throw new Error(`Thiếu valueId cho global value ${v.value}`);
          // verify existence
          const valDoc = await AttributeValue.findById(v.valueId).session(session);
          if (!valDoc) throw new Error(`AttributeValue ${v.valueId} không tồn tại`);
          valuesOut.push({ valueId: valDoc._id, value: valDoc.value });
        } else if (v.mode === "create_shop") {
          // create new value bound to shop
          const newVal = await AttributeValue.create([{
            attributeId: attributeDoc._id,
            value: v.value,
            image: v.image || "",
            priceAdjustment: v.priceAdjustment ?? 0,
            shopId,
          }], { session });
          valuesOut.push({ valueId: newVal[0]._id, value: newVal[0].value });
        } else if (v.mode === "use_global_and_add_shop") {
          // use provided global valueId if exists; else create new shop value
          if (v.valueId) {
            const valDoc = await AttributeValue.findById(v.valueId).session(session);
            if (!valDoc) throw new Error(`AttributeValue ${v.valueId} không tồn tại`);
            valuesOut.push({ valueId: valDoc._id, value: valDoc.value });
          } else {
            const newVal = await AttributeValue.create([{
              attributeId: attributeDoc._id,
              value: v.value,
              image: v.image || "",
              priceAdjustment: v.priceAdjustment ?? 0,
              shopId,
            }], { session });
            valuesOut.push({ valueId: newVal[0]._id, value: newVal[0].value });
          }
        } else {
          // default behavior: if valueId provided -> use it, else create shop value
          if (v.valueId) {
            const valDoc = await AttributeValue.findById(v.valueId).session(session);
            if (!valDoc) throw new Error(`AttributeValue ${v.valueId} không tồn tại`);
            valuesOut.push({ valueId: valDoc._id, value: valDoc.value });
          } else {
            const newVal = await AttributeValue.create([{
              attributeId: attributeDoc._id,
              value: v.value,
              image: v.image || "",
              priceAdjustment: v.priceAdjustment ?? 0,
              shopId,
            }], { session });
            valuesOut.push({ valueId: newVal[0]._id, value: newVal[0].value });
          }
        }

        // If user requested shop-level override (TH4), create ShopAttributeValue
        if (v.override && v.valueId) {
          // create or update override
          await ShopAttributeValue.findOneAndUpdate(
            { shopId, attributeValueId: v.valueId },
            {
              $set: {
                customValue: v.override.customValue ?? undefined,
                customImage: v.override.customImage ?? undefined,
                customPriceAdjustment: v.override.customPriceAdjustment ?? undefined,
                isActive: v.override.isActive ?? true,
              },
            },
            { upsert: true, new: true, session }
          );
        }
      } // end values loop

      attributesList.push({ attributeId: attributeDoc._id, label: attributeDoc.label, values: valuesOut });
    } // end attributes loop

    // 3) optionally auto-generate variants
    let generatedVariants = [];
    if (autoGenerateVariants && attributesList.length) {
      // prepare arrays as expected by generateVariantsForProduct
      const arrays = attributesList.map((a) => ({
        attributeId: a.attributeId,
        values: a.values.map((v) => ({ valueId: v.valueId })),
      }));
      const genRes = await generateVariantsForProduct(createdProduct._id, arrays);
      if (!genRes.success) throw new Error(genRes.message);
      generatedVariants = genRes.data;
    }

    await session.commitTransaction();
    session.endSession();

    // prepare response: product + attributesList + generatedVariants
    return {
      success: true,
      message: "Tạo sản phẩm hoàn chỉnh thành công",
      data: {
        product: createdProduct,
        attributes: attributesList,
        variants: generatedVariants,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return { success: false, message: error.message };
  }
};

export const createProduct = async (payload) => {
  try {
    const { pdName, basePrice, description = "", images = [], shopId } = payload;
    if (!pdName || basePrice === undefined) throw new Error("Thiếu tên hoặc basePrice");
    const p = await Product.create({ pdName, basePrice, description, images, shopId });
    return { success: true, message: "Tạo product thành công", data: p };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateProduct = async (id, body) => {
  try {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");
    const update = {};
    const allowed = ["pdName", "basePrice", "description", "images", "isActive"];
    allowed.forEach((k) => {
      if (body[k] !== undefined) update[k] = body[k];
    });
    const p = await Product.findByIdAndUpdate(id, update, { new: true });
    if (!p) throw new Error("Không tìm thấy product");
    return { success: true, message: "Cập nhật product thành công", data: p };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteProduct = async (id) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");
    // remove variants
    await ProductVariant.deleteMany({ productId: id }).session(session);
    // remove product
    const p = await Product.findByIdAndDelete(id).session(session);
    if (!p) throw new Error("Không tìm thấy product để xóa");
    await session.commitTransaction();
    session.endSession();
    return { success: true, message: "Xóa product và variants thành công" };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return { success: false, message: error.message };
  }
};

export const toggleProductActive = async (id) => {
  try {
    if (!toObjectId(id)) throw new Error("Id không hợp lệ");
    const p = await Product.findById(id);
    if (!p) throw new Error("Không tìm thấy product");
    p.isActive = p.isActive === false ? true : false;
    await p.save();
    return { success: true, message: "Cập nhật trạng thái product thành công", data: p };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getProductsByShop = async ({ shopId, page = 1, limit = 20 }) => {
  try {
    if (!toObjectId(shopId)) throw new Error("shopId không hợp lệ");
    const skip = (Math.max(1, page) - 1) * limit;
    const total = await Product.countDocuments({ shopId });
    const items = await Product.find({ shopId }).skip(skip).limit(limit).lean();
    // optionally populate variants count
    const itemsWithVariants = await Promise.all(items.map(async (p) => {
      const variants = await ProductVariant.find({ productId: p._id }).lean();
      return { ...p, variantCount: variants.length };
    }));
    return { success: true, message: "Lấy sản phẩm của shop thành công", data: { items: itemsWithVariants, total, page, limit } };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const searchProducts = async ({ q, page = 1, limit = 20 }) => {
  try {
    const skip = (Math.max(1, page) - 1) * limit;
    const regex = new RegExp(q || "", "i");
    // search name or description
    const filter = { $or: [{ pdName: regex }, { description: regex }] };
    const total = await Product.countDocuments(filter);
    const items = await Product.find(filter).skip(skip).limit(limit).lean();
    return { success: true, message: "Tìm kiếm sản phẩm thành công", data: { items, total, page, limit } };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const filterProducts = async ({ minPrice, maxPrice, categoryId, page = 1, limit = 20 }) => {
  try {
    const skip = (Math.max(1, page) - 1) * limit;
    const filter = {};
    // Note: filtering by price requires computing variant prices or basePrice only.
    if (minPrice !== undefined) filter.basePrice = { $gte: minPrice };
    if (maxPrice !== undefined) filter.basePrice = { ...filter.basePrice, $lte: maxPrice };
    if (categoryId) filter.categoryId = categoryId;
    const total = await Product.countDocuments(filter);
    const items = await Product.find(filter).skip(skip).limit(limit).lean();
    return { success: true, message: "Lọc sản phẩm thành công", data: { items, total, page, limit } };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getProductVariants = async (productId) => {
  try {
    if (!toObjectId(productId)) throw new Error("productId không hợp lệ");
    const variants = await ProductVariant.find({ productId }).lean();
    const populated = await Promise.all(variants.map((v) => buildPopulatedVariant(v)));
    return { success: true, message: "Lấy variants thành công", data: populated };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateBasePrice = async (productId, newBasePrice) => {
  try {
    if (!toObjectId(productId)) throw new Error("productId không hợp lệ");
    const p = await Product.findById(productId);
    if (!p) throw new Error("Không tìm thấy product");
    p.basePrice = newBasePrice;
    await p.save();
    return { success: true, message: "Cập nhật basePrice thành công", data: p };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export default {
  getProductsFull,
  getProductByIdFull,
  generateVariantsForProduct,
  fullCreateProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
  getProductsByShop,
  searchProducts,
  filterProducts,
  getProductVariants,
  updateBasePrice,
};
