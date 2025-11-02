// utils/getShopIdFromAccount.js
import Shop from "../modules/shop/shop.model.js";
import { ApiError } from "./index.js";

export const getShopIdFromAccount = async (accountId) => {
  const shop = await Shop.findOne({ accountId });
  if (!shop) throw ApiError.forbidden("Tài khoản này không thuộc shop nào");
  return shop._id;
};
