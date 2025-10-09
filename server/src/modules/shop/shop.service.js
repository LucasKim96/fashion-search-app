// Shop Service
import Shop from "./shop.model.js";

export const getAllShops = async () => {
  return await Shop.find().populate("accountId");
};

export const getShopById = async (id) => {
  return await Shop.findById(id).populate("accountId");
};

export const createShop = async (data) => {
  const shop = new Shop(data);
  return await shop.save();
};

export const updateShop = async (id, data) => {
  return await Shop.findByIdAndUpdate(id, data, { new: true });
};

export const deleteShop = async (id) => {
  return await Shop.findByIdAndDelete(id);
};
