import { Router } from "express";
import {
  deleteComment,
  getCommentsOfBlogWithSameId,
  postComment,
} from "../controllers/comments.controller";
import AuthMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.route("/:blogId").post(AuthMiddleware, postComment);
router.route("/:commentId").delete(AuthMiddleware, deleteComment);

router
  .route("/paginate/:blogId")
  .get(AuthMiddleware, getCommentsOfBlogWithSameId);

export default router;
