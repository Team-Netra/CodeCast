import { Router } from "express";
import { 
    saveFileContents, 
    getRoomFiles, 
    getFileContents,
    createFile,
    deleteFile
} from "../controllers/file.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// File operations
router.route("/save").patch(saveFileContents);
router.route("/create").post(createFile);
router.route("/:fileId").get(getFileContents).delete(deleteFile);

// Room files
router.route("/room/:roomId").get(getRoomFiles);

export default router;