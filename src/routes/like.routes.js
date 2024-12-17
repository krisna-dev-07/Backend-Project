import { Router } from "express";
import { toggleCommentLike, toggleVideoLike } from "../controllers/liked.controller.js";

const router=Router()

router.route("/toggle_videoId").post(toggleVideoLike)
router.route("/toggle_commentId").post(toggleCommentLike)

export default router