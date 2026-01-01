import { Router } from "express";
import {createroom,addusertoroom} from "../controllers/room.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route('/create-room').post(verifyJWT,createroom)
router.route('/addUserToRoom').post(verifyJWT,addusertoroom)

export default router