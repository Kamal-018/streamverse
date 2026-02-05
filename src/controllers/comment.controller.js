import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Apiresponse } from "../utils/apiresponse.js"
import { apierror } from "../utils/apierror.js"


const addComment = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    const { content } = req.body

    if (!isValidObjectId(videoId)) {
        throw new apierror(400, "videoid not valid")
    }

    if (!content || content.trim() === "") {
        throw new apierror(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    if (!comment) {
        throw new apierror(500, "something went wrong while adding the comment")
    }

    const populatedComment = await Comment.findById(comment._id).populate("owner", "username fullname avatar");

    return res
        .status(200)
        .json(new Apiresponse(200, populatedComment, "comment added successfully"))
})

const editComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;
    const { content } = req.body;


    if (!content || content.trim() === "") {
        throw new apierror(400, "Content required to update comment");
    }

    if (!isValidObjectId(commentId)) {
        throw new apierror(400, "Invalid Comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new apierror(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new apierror(403, "No permission to edit the comment");
    }

    const editedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content
            }
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new Apiresponse(200, editedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new apierror(400, "not a valid comment ID")
    }

    const comment = await Comment.findById(commentId)

    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new apierror(403, "you dont have permission to delete this comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if (!deletedComment) {
        throw new apierror(500, "something went wrong while deleting comment")
    }

    return res
        .status(200)
        .json(new Apiresponse(200, deletedComment, "comment deleted successfully"))
})

const getVideoComments = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const aggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$ownerDetails" }
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    }

    const comments = await Comment.aggregatePaginate(aggregate, options);

    if (!comments) {
        throw new apierror(501, "problem during fetching comments")
    }

    return res
        .status(200)
        .json(new Apiresponse(200, comments, "Comments fetched successfully"));

});

export { addComment, editComment, deleteComment, getVideoComments }



