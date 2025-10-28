import { authMiddleware } from "./auth.middleware.js";
import errorMiddleware from "./error.middleware.js";
import loggerMiddleware from "./logger.middleware.js";
import { validateShop } from "./shop.middleware.js";
import { errorHandler, notFoundHandler } from "./errorHandler.js";
import {
  uploadUserAvatar,
  uploadShopImage,
  uploadShopDefaultImage,
} from "./upload.middleware.js";

export {
  authMiddleware,
  errorMiddleware,
  loggerMiddleware,
  validateShop,
  errorHandler,
  notFoundHandler,
  uploadUserAvatar,
  uploadShopImage,
  uploadShopDefaultImage,
};
