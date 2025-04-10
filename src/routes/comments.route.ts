import { Router } from "express";
import { commentBlog } from "../controllers/comments.controller";

const router = Router();

router.route("/").post(commentBlog);

export default router;
