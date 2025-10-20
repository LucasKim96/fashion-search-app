// Export
// src/modules/product/index.js
import * as productController from "./product.controller.js";
import * as productService from "./product.service.js";
import productRoutes from "./product.route.js";
import Product from "./product.model.js";
import ProductVariant from "./productVariant.model.js";

export {
  productController,
  productService,
  productRoutes,
  Product,
  ProductVariant,
};
