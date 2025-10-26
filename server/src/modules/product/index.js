// Export
// src/modules/product/index.js
import * as productController from "./product.controller.js";
import * as productService from "./product.service.js";
import ProductRoutes from "./product.route.js";
import Product from "./product.model.js";
import ProductVariant from "./productVariant.model.js";

// Attribute-related imports
import * as attributeController from "./attribute.controller.js";
import * as attributeService from "./attribute.service.js";
import AttributeRoutes from "./attribute.route.js";
import Attribute from "./attribute.model.js";
import * as attributeValidate from "./attribute.validate.js";

// AttributeValue-related imports
import * as attributeValueController from "./attributeValue.controller.js";
import AttributeValue from "./attributeValue.model.js";
import * as attributeValueService from "./attributeValue.service.js";
import AttributeValueRoutes from "./attributeValue.route.js";

// ProductVariant service import
import * as productVariantService from "./productVariant.service.js";

export {
  productController,
  productService,
  ProductRoutes,
  Product,
  ProductVariant,
  productVariantService,
  attributeController,
  attributeService,
  AttributeRoutes,
  Attribute,
  attributeValidate,
  attributeValueController,
  AttributeValue,
  attributeValueService,
  AttributeValueRoutes,
};
