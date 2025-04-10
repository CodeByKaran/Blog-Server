import { Router } from "express";
import { likeBlog } from "../controllers/likes.controller";

const router = Router();

router.route("/").post(likeBlog);

export default router;
