import { Router } from "express";
import { saveBlog, removeBlog } from "../controllers/saves.controller";
import AuthMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.route("/:blogId").post(AuthMiddleware, saveBlog);
router.route("/:blogId").delete(AuthMiddleware, removeBlog);

export default router;
