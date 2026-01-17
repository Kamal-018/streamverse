import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Apiresponse } from "../utils/apiresponse.js"
import { apierror } from "../utils/apierror.js"

const toggleVideoLike = asyncHandler(async(req, res)=> {

   const { videoId } = req.params

   if (!isValidObjectId(videoId)) {
    throw new apierror(400, "not a valid videoId")
   }

   const likedVideo = await Like.findOne({
    video: videoId,
    likedBy : req.user?._id
   })

   if(likedVideo) {
    //unliking the video
    await Like.findByIdAndDelete(likedVideo._id)

    return res 
    .status(200)
    .json(new Apiresponse(200, {isLiked: false}, "Video unliked"))
   }

   //like the video
    await Like.create({
    video: videoId,
    likedBy: req.user?._id
   })


   return res
   .status(200)
   .json(new Apiresponse(200, {isLiked: true}, "Video liked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {

    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new apierror(400, "Invalid Comment ID")
    }

    const likedAlready = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    })

    if (likedAlready) {
        
        await Like.findByIdAndDelete(likedAlready._id);

        return res
        .status(200)
        .json(new Apiresponse(200, { isLiked: false }, "Comment unliked"))
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
    });

    return res
    .status(200)
    .json(new Apiresponse(200, { isLiked: true }, "Comment liked"))
});

const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: { $exists: true } 
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails" 
                    },
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            views: 1,
                            ownerDetails: {
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $sort: {
                createdAt: -1
            }
        },

        {
            $replaceRoot: { newRoot: "$likedVideo" }
        }
    ]);

    return res
    .status(200)
    .json(new Apiresponse(200, likedVideos, "Liked videos fetched successfully"));
});

export { toggleCommentLike, toggleVideoLike, getLikedVideos}