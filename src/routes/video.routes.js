import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getAllVideos, publishVideo, getVideoById, UpdateVideo, toggleVideoIsPublished } from "../controllers/video.controller.js";

const router = Router();

router.route("/").get(getAllVideos);

router.route("/Publish-Video").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishVideo
);

router.route("/video-Id")  // Dynamically handle video ID
    .get(verifyJWT, getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), UpdateVideo);

router.route("/toggle-status").patch(verifyJWT, toggleVideoIsPublished);  // Fixed typo here

export default router;
