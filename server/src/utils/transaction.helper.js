// server/src/utils/transaction.helper.js
import mongoose from "mongoose";
import { handleMongooseError } from "./mongooseError.helper.js";

/**
 * Wrapper tiện dụng để chạy transaction an toàn
 * @param {Function} fn - hàm async nhận đối số (session)
 * @returns {*} Kết quả của hàm fn
 */
export const withTransaction = async (fn) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await fn(session);

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw handleMongooseError(error);
  } finally {
    session.endSession();
  }
};
