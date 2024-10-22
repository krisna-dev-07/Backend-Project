import { Router } from "express";
import { loginUser, logOutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxcount: 1
        },
        {
            name: "coverImage",
            maxcount: 1
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(verifyJWT, logOutUser)
export default router








