import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Apiresponse } from "../utils/apiresponse.js";
import { apierror } from "../utils/apierror.js";

const getChannelStats = asyncHandler(async (req, res) => {


    const userId = req.user?._id

    const channelStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totalLikes: { $sum: { $size: "$likes" } }
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "subscribers"
            }
        }

    ])

    const totalSubscribers = await Subscription.countDocuments({ channel: userId })


    const videoStats = await Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totalLikes: { $sum: { $size: "$likes" } }
            }
        }
    ])

    const stats = {
        totalSubscribers,
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes: videoStats[0]?.totalLikes || 0
    }

    return res
        .status(200)
        .json(new Apiresponse(200, stats, "Channel stats fetched successfully"))
});


const getChannelVideos = asyncHandler(async (req, res) => {

    const videos = await Video.find({ owner: req.user._id })

    return res
        .status(200)
        .json(new Apiresponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats, getChannelVideos
}