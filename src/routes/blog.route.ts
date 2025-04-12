import { Router } from "express";
import {
  checkSameTitle,
  deleteBlogs,
  deleteSingleBlogImage,
  getBlogs,
  postBlogs,
  updateBlogs,
  uploadSingleBlogImage,
  getSingleBlog,
  getAuthorBlogs,
} from "../controllers/blog.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.route("/").get(AuthMiddleware, getBlogs);
router.route("/").post(AuthMiddleware, upload.array("images", 5), postBlogs);
router.route("/:blogId").delete(AuthMiddleware, deleteBlogs);
router.route("/:blogId/title-check/:title").get(AuthMiddleware, checkSameTitle);
router.route("/:blogId").patch(AuthMiddleware, updateBlogs);
router.route("/:blogId/image").delete(AuthMiddleware, deleteSingleBlogImage);
router
  .route("/:blogId/image")
  .patch(AuthMiddleware, upload.single("image"), uploadSingleBlogImage);
router.route("/:blogId").get(AuthMiddleware, getSingleBlog);
router.route("/author/:authorId").get(AuthMiddleware, getAuthorBlogs);

export default router;
