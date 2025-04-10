import { Router } from "express";
import { getBlogs } from "../controllers/blog.controller";
import AuthMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.route("/").get(AuthMiddleware, getBlogs);

export default router;
