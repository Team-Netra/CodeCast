import { Router } from "express";
import {createroom,addusertoroom,getRoomByPin} from "../controllers/room.controller.js"
import { getRoomFiles, getFileContents } from "../controllers/file.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route('/create-room').post(verifyJWT,createroom)
router.route('/addUserToRoom').post(verifyJWT,addusertoroom)
router.route('/by-pin/:cc_pin').get(verifyJWT, getRoomByPin)
router.route('/files/:fileId').get(verifyJWT, getFileContents)
router.route('/:roomId/all-files').get(verifyJWT, getRoomFiles);

export default router