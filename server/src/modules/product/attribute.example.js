// Example usage of attribute validation
// This file shows how to use the validation middleware

import express from "express";
import { body, param, query } from "express-validator";
import {
  validateObjectIdParam,
  validateCreateAttribute,
  validateUpdateAttribute,
  validateGetAttributes,
  validateSearchAttributes
} from "./attribute.validate.js";

const router = express.Router();

// Example: How to use validation in routes
// GET /api/attributes?page=1&limit=10&sortBy=createdAt&sortOrder=desc
router.get("/", validateGetAttributes, (req, res) => {
  // Validation will automatically check:
  // - page: must be integer 1-10000
  // - limit: must be integer 1-100  
  // - sortBy: must be one of ['createdAt', 'updatedAt', 'label']
  // - sortOrder: must be one of ['asc', 'desc']
  // - isGlobal: must be boolean if provided
  // - shopId: must be valid MongoDB ObjectId if provided
  
  res.json({ message: "Validation passed!" });
});

// POST /api/attributes
router.post("/", validateCreateAttribute, (req, res) => {
  // Validation will automatically check:
  // - label: required, 2-50 characters
  // - isGlobal: optional boolean
  // - shopId: optional valid ObjectId
  // - values: optional array, max 50 items
  // - values.*.value: required, 1-100 characters
  // - values.*.priceAdjustment: optional number, -999999 to 999999
  // - values.*.image: optional string, max 500 characters
  // - values.*.shopId: optional valid ObjectId
  
  res.json({ message: "Validation passed!" });
});

// PUT /api/attributes/:id
router.put("/:id", validateObjectIdParam("id"), validateUpdateAttribute, (req, res) => {
  // Validation will automatically check:
  // - id: must be valid MongoDB ObjectId
  // - label: optional, 2-50 characters if provided
  // - isGlobal: optional boolean
  // - shopId: optional valid ObjectId
  // - values: optional array, max 50 items
  // - values.*.value: required if provided, 1-100 characters
  // - values.*.priceAdjustment: optional number, -999999 to 999999
  // - values.*.image: optional string, max 500 characters
  // - values.*.shopId: optional valid ObjectId
  
  res.json({ message: "Validation passed!" });
});

// GET /api/attributes/search?query=color&page=1&limit=10
router.get("/search", validateSearchAttributes, (req, res) => {
  // Validation will automatically check:
  // - query: optional string, max 100 characters
  // - isGlobal: optional boolean
  // - shopId: optional valid ObjectId
  // - page: must be integer 1-10000
  // - limit: must be integer 1-100
  
  res.json({ message: "Validation passed!" });
});

export default router;

/*
Example validation error responses:

1. Invalid ObjectId:
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": [
    {
      "type": "field",
      "value": "invalid-id",
      "msg": "id không hợp lệ",
      "path": "id",
      "location": "params"
    }
  ]
}

2. Invalid label:
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": [
    {
      "type": "field",
      "value": "a",
      "msg": "Label attribute phải có từ 2-50 ký tự",
      "path": "label",
      "location": "body"
    }
  ]
}

3. Invalid priceAdjustment:
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": [
    {
      "type": "field",
      "value": "not-a-number",
      "msg": "priceAdjustment phải là số",
      "path": "values.0.priceAdjustment",
      "location": "body"
    }
  ]
}

4. Invalid pagination:
{
  "success": false,
  "message": "Dữ liệu đầu vào không hợp lệ",
  "errors": [
    {
      "type": "field",
      "value": "0",
      "msg": "Page phải là số từ 1 đến 10,000",
      "path": "page",
      "location": "query"
    }
  ]
}
*/
