import { Router } from "express";
import { saveBlog } from "../controllers/saves.controller";

const router = Router();

router.route("/").post(saveBlog);

export default router;
