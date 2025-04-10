import { Router } from "express";
import {
  getSessionUser,
  refreshOtp,
  refreshTokens,
  signIn,
  signOut,
  signUp,
  updateUserInfo,
  uploadProfileImage,
  verifyOtp,
} from "../controllers/user.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

router.route("/sign-up").post(signUp);
router.route("/verify-otp").post(verifyOtp);
router.route("/sign-in").post(signIn);
router.route("/refresh-token").get(refreshTokens);
router.route("/refresh-otp").patch(refreshOtp);
router.route("/sign-out").delete(AuthMiddleware, signOut);
router
  .route("/profile-image")
  .patch(AuthMiddleware, upload.single("profileImage"), uploadProfileImage);
router.route("/profile-info").patch(AuthMiddleware, updateUserInfo);

router.route("/session").get(AuthMiddleware, getSessionUser);

export default router;
