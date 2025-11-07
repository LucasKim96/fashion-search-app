import mongoose from "mongoose";
import Attribute from "../modules/product/attribute.model.js";
import AttributeValue from "../modules/product/attributeValue.model.js";

export const toObjectId = (id) => {
  if (!id) return null;
  try { return new mongoose.Types.ObjectId(id); } catch { return null; }
};

export const validateAttributeValue = (value) => {
  if (!value || typeof value !== "object") throw new Error("Giá trị attribute không hợp lệ");
  if (!value.value || value.value.trim() === "") throw new Error("Giá trị attribute không được để trống");
  return true;
};

export const fetchAttributeWithValues = async (attributeId, session = null) => {
  const attribute = await Attribute.findById(attributeId).session(session).lean();
  if (!attribute) return null;

  const values = await AttributeValue.find({
    attributeId,
    isActive: { $ne: false },
  })
    .session(session)
    .lean();

  return { ...attribute, values };
};