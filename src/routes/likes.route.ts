import { Router } from "express";
import { likeBlog, unlikeBlog } from "../controllers/likes.controller";
import AuthMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.route("/:blogId").post(AuthMiddleware, likeBlog);
router.route("/:blogId").delete(AuthMiddleware, unlikeBlog);

export default router;
