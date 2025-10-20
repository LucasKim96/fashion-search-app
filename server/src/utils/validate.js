import mongoose from "mongoose";
import ApiError from "./apiError.js";

export const validateObjectId = (id, name = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`${name} không hợp lệ`);
  }
};
