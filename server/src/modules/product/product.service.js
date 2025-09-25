// Product Service
import Product from "./product.model.js";

export const getAllProducts = async () => {
  return await Product.find();
};

export const createProduct = async (data) => {
  const product = new Product(data);
  return await product.save();
};
