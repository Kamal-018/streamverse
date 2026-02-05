import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    uploadVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    getAllVideos
} from "../controllers/video.controller.js";

const router = Router();

router.route("/").get(getAllVideos);

router.route("/:videoId").get(getVideoById);

// secured routes 
router
    .route("/upload")
    .post(
        verifyJWT,
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 }
        ]),
        uploadVideo
    )

router
    .route("/:videoId")
    .patch(
        verifyJWT,
        upload.single("thumbnail"),
        updateVideo
    )

router
    .route("/:videoId")
    .delete(verifyJWT, deleteVideo);

export default router;
