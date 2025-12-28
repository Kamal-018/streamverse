import mongoose from "mongoose";
import {Video} from "../models/video.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Apiresponse } from "../utils/apiresponse.js"
import { apierror } from "../utils/apierror.js"
import { uploadOnCloudinary , deleteOnCloudinary} from "../utils/cloudinary.js"

//upload a video
const publishVideo = asyncHandler(async(req,res)=> {

    const {title, description} = req.body

    if (!title || !description) {
        throw new apierror(400, "fields cannot be empty")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    
    if (!videoLocalPath) {
    throw new apierror(400, "video file doesnt exist")
  }

   const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!thumbnailLocalPath){
        throw new apierror(400, "Thumbnail is required")
    }

    const uploadVideo = await uploadOnCloudinary(videoLocalPath)

    if(!uploadVideo){
        throw new apierror(500, "Error while uploading video")
    }

    const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
            
    if(!uploadThumbnail){
        throw new apierror(500, "Error while uploading thumbnail")
    }

    const video = await Video.create({
        title, 
        description,
        videoFile: uploadVideo.url,
        thumbnail: uploadThumbnail.url,
        duration: uploadVideo.duration

    })

    return res 
    .status(200)
    .json(new Apiresponse(200, "video uploaded succesfully"))

})

//get video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
               $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "user",
                    pipeline: [
                        {
                            $project: {
                                fullname: 1,
                                username: 1,
                                avatar: 1,
                                coverImage: 1,
                                email: 1,                
                            }
                        },
                    ]
                
                },
                
            },
            {
                $addFields: {
                    owner: {
                        $first: "$user"
                    }
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    owner: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    duration: 1,
                    views: 1
                }
            }
        ]
    )

    if(!video?.length) {
        return res
        .status(200)
        .json(new Apiresponse(200, video[0], "Video not found"))
    }

    return res
    .status(200)
    .json(new Apiresponse(200, video[0], "Video fetched successfully"))
})

//update video (need some improvement)
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new apierror(400, "Invalid Video ID");
    }

    if (!(title || description)) {
        throw new apierror(400, "Title or Description is required for update");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new apierror(404, "Video not found");
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new apierror(403, "Unauthorized:  cannot edit on others video");
    }

    const updatedData = { title, description };

    
    const thumbnailLocalPath = req.file?.path;

    if (thumbnailLocalPath) {
        const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!uploadedThumbnail) {
            throw new apierror(500, "Failed to upload new thumbnail");
        }

       
        if (video.thumbnail) {
            await deleteOnCloudinary(video.thumbnail); 
        }

        updatedData.thumbnail = uploadedThumbnail.url;
    }

 
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updatedData },
        { new: true }
    );

    return res
        .status(200)
        .json(new Apiresponse(200, updatedVideo, "Video updated successfully"));
});

//delete a video

const deleteVideo = asyncHandler(async(req, res)=>{
   
    const { videoId } = req.params

    const video = await Video.findById(videoId);

    if (!video) {
        throw new apierror(404, "Video not found");
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
    throw new apierror(403, " cannot delete someone else's video");
    }

    await deleteOnCloudinary(video.videoFile)
    await deleteOnCloudinary(video.thumbnail)

    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(new Apiresponse(200, {}, "Video deleted successfully"))

})


export {publishVideo,getVideoById, updateVideo, deleteVideo }