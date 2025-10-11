import express from "express";
import * as AuthController from "./auth.controller.js";
import { registerValidator, loginValidator , changePasswordValidator} from "./auth.validate.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerValidator, AuthController.register);
router.post("/login", loginValidator, AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/change-password", authMiddleware, changePasswordValidator, AuthController.changePassword);
router.post("/verify", authMiddleware, AuthController.verifyToken);
router.get("/me", authMiddleware, AuthController.getProfile);

export default router;
