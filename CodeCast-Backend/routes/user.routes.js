import { Router } from "express";
import {registerUser,loginUser,logoutUser , refreshAccessToken , updateName , changeCurrentPassword} from "../controllers/user.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT , logoutUser)
router.route("/refresh-token").get(refreshAccessToken)
router.route("/update-name").post(verifyJWT , updateName)
router.route("/update-password").post(verifyJWT , changeCurrentPassword)


export default router