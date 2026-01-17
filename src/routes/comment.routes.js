import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    addComment, 
    editComment, 
    deleteComment, 
    getVideoComments 
} from "../controllers/comment.controller.js";

const router = Router();


router
.route("/:videoId")
.get(getVideoComments);

// secured routes

router.use(verifyJWT);

router
.route("/:videoId")
.post(addComment);


router
.route("/:commentId")
.patch(editComment);


router
.route("/:commentId")
.delete(deleteComment);

export default router;
