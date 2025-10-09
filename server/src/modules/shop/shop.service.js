// server/src/modules/shop/shop.service.js
import ShopModel from "./shop.model.js";

export const getAllShops = async () => {
  return await ShopModel.find().populate("accountId");
};

export const getShopById = async (id) => {
  return await ShopModel.findById(id).populate("accountId");
};

export const createShop = async (data) => {
  const shop = new ShopModel(data);
  return await shop.save();
};

export const updateShop = async (id, data) => {
  return await ShopModel.findByIdAndUpdate(id, data, { new: true });
};

export const deleteShop = async (id) => {
  return await ShopModel.findByIdAndDelete(id);
};
