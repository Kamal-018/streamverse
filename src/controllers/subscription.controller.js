import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js"
import { asyncHandler } from "../utils/async_handler.js";
import { Apiresponse } from "../utils/api_response.js"
import { apierror } from "../utils/api_error.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

//get user channel subscriber

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
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
            $addFields: {
                subscriber: {
                    $first: "$user"
                }
            }
        },
    ])

    return res
        .status(200)
        .json(new Apiresponse(200, subscriberList || {}, "Channel Subscribers fetched successfully"))

})


//to get the channel that this user has subscribed

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
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

//toggle feature for subscribed user

const toggleSubscription = asyncHandler(async (req, res) => {

    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new apierror(400, "invalid channel id")
    }

    const isSubscribed = await Subscription.findOne({

        channel: channelId,
        subscriber: req.user?._id
    })

    if (isSubscribed) {
        await Subscription.findByIdAndDelete(isSubscribed._id)

        return res
            .status(200)
            .json(new Apiresponse(200, { subscribed: false }, "unsubscribed"))
    }

    await Subscription.create({

        channel: channelId,
        subscriber: req.user?._id
    })

    return res
        .status(200)
        .json(new Apiresponse(200, { subscribed: true }, "Subscribed"))
})



export { getUserChannelSubscribers, getSubscribedChannels, toggleSubscription }
