import { Router } from "express"
import{verifyJWT} from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"
import {getAllVideos,publishVideo} from"../controllers/video.controller.js"

const router=Router()

router.route("/").get(getAllVideos)
router.route("/Publish-Video").post(
    verifyJWT,
    upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),publishVideo
)

export default router