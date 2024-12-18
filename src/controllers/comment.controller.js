import mongoose, { mongo } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { Video } from "../models/video.model.js";


const getAllComments = asyncHandler(async (req, res) => {
    const { videoId, page = 1, limit = 10 } = req.query

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const video = Video.findById(videoId)

    if (!video) {
        throw new ApiError(402, "Video not found")
    }

    const commentaggregate = Comment.aggregate([
        {
            // Filters comments related to the video with the given videoId.

            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            // Joins the users collection to get details of the each comment owner
            /* For every document in the comments collection:
                MongoDB looks at the owner field.
                It searches for documents in the users collection where _id matches the value of the owner field.*/
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: owner
            }
        },
        {
            // Joins the likes collection to fetch likes related to each comment.
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "Likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$Likes"
                },
                owner: {
                    $first: "$owner"
                },
                isliked: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: avatar.url
                },
                likesCount: 1,
                isliked: 1,
                createdAt: 1

            }
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    }
    const comments = Comment.aggregatePaginate(
        commentaggregate,
        options
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, comments, "Comments fetched Successfully")
        )

})

// create a comments
const addComment = asyncHandler(async (req, res) => {

    const { videoId } = req.params
    const { content } = req.body

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const video = Video.findById(videoId)

    if (!video) {
        throw new ApiError(402, "Video not found")
    }

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.create({
        comment,
        video: videoId,
        owner: req.user?._id
    })

    if (!comment) {
        throw new ApiError(500, "Failed to add comment please try again")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"))


})

// update a commnet
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment Id")
    }


    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only comment owner can edit their comment");
    }

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content
            },

        },
        {
            new: true
        }
    )

    if (!updatedComment) {
        throw new ApiError(500, "Failed to edit comment please try again");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment edited successfully")
        );
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment Id")
    }


    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only comment owner can edit their comment");
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    await Comment.findByIdAndDelete(commentId)

    await Like.deleteMany({
        comment: commentId,
        likedBy: req.user
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, { commentId }, "Comment deleted successfully")
        );
})

export {
    getAllComments,
    addComment,
    updateComment,
    deleteComment
}