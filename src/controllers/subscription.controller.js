import mongoose, {isValidObjectId} from "mongoose";
import {Subscription, subscription} from "../models/subscription.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Apiresponse } from "../utils/apiresponse.js"
import { apierror } from "../utils/apierror.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

//get user channel subscriber

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new apierror(400, "Channel id doesnt exist")
    }

    const subscriberList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "subscriber",
                as: "user",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscriber: {
                    $first: "$user"
                } 
            }
        },
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscriberList || {}, "Channel Subscribers fetched successfully"))

})


//to get the channel that this user has subscribed

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new apierror(400, "SubscriberId not valid")
    }

    const subscribedChannelList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "channel",
                as: "channel",
                pipeline: [
                    {
                        $project:{
                            _id: 1,
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channel: {
                    $first: "$channel"
                }
            },
            
        },
    ])


    return res
    .status(200)
    .json(new Apiresponse(200, subscribedChannelList || {}, "Subscribed channel fetched successfully"))
})

export{getUserChannelSubscribers,getSubscribedChannels }
