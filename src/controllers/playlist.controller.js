import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Apiresponse } from "../utils/apiresponse.js"
import { apierror } from "../utils/apierror.js"
import { uploadOnCloudinary , deleteOnCloudinary} from "../utils/cloudinary.js"

const createPlaylist = asyncHandler(async(req,res)=> {

    const {name, description } = req.body

    if ([name, description].some((field)=> field?.trim() === "")) {
        throw new apierror(400, "all fields required")
    }

    const playlist = await Playlist.create({
        name, 
        description,
        owner: req.user?._id
    })

    return res
    .status(201)
    .json(new Apiresponse(201, playlist, "playlist created"))

})

const addVideoToPlaylist = asyncHandler(async(req,res)=> {

    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new apierror(400, "video or playlist id isnt valid")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new apierror(404, "playlist not found")
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        
        throw new apierror(403, "No permission to add videos to this playlist");
    }

    if (playlist.videos.includes(videoId)) {
     return res
    .status(200)
    .json(new Apiresponse(200, playlist, "Video already in the playlist"));
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: { videos: videoId } 
        },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new apierror(500, "Something went wrong while updating playlist");
    }

    return res 
    .status(200) 
    .json(200, playlist, "video added in the playlist")

})

const removeVideoFromPlaylist = asyncHandler(async(req,res)=> {

    const{ playlistId, videoId } = req.params

    if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
        throw new apierror(400, "Need valid video or playlist id.")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new apierror(400, "playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id) {
        throw new apierror (403, "you dont have permission to edit this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndDelete(
        playlistId,
        {
            $pull:{
                videos:video_id
            }
        },
        {new:true}//updated document returned
    )
    if(!updatedPlaylist) {
        throw new apierror(500, "failed to remove video from playlist")
    }

    return res
    .status(200)
    .json(200, updatedPlaylist,"video deletd form the playlist succesfully")
})

const updatePlaylist = asyncHandler(async(req,res)=> {

    const { playlistId } = req.params
    const { name , description } = req.body

    if(!isValidObjectId(playlistId)) {
        throw new apierror (400, "playlist id invalid")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new apierror(400, "playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id) {
        throw new apierror (403, "you dont have permission to edit this playlist")
    }

    if([name,description].some((field)=>field?.trim ==="")) {
        throw new apierror(400, "fields cannot be empty")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
        $set: {
            name, description
        }
    },
        {new:true}
    )

    if(!updatedPlaylist) {
        throw new apierror (500, "problem during updation of playlist")
    }

    return res
    .status(200)
    .json(200, updatePlaylist, "playlist updation successful")

})

const deletePlaylist = asyncHandler(async(req,res)=> {

    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new apierror(400, "not a valid playlist id")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(
        {
            _id:playlistId,
            owner:req.user?._id
        }
    )

    if(!deletedPlaylist) {
        throw new apierror(404,"unauthorized delete or problem during deletion")
    }

    return res 
    .status(200)
    .json(200, deletedPlaylist, "playlist deleted succesfully")

})


const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new apierror(400, "Invalid user ID");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "videoOwner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            videoOwner: { $first: "$videoOwner" }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalVideos: { $size: "$videos" },
                totalViews: { $sum: "$videos.views" }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new Apiresponse(200, playlists, "User playlists fetched successfully"));
});






export { createPlaylist, addVideoToPlaylist, removeVideoFromPlaylist, updatePlaylist, deletePlaylist, getUserPlaylists }

