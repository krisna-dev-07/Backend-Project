import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Tweet } from "../models/tweets.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    if (!tweet) {
        throw new ApiError(500, "Failed to tweet please try again")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "Your tweet is succeessfully posted")
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    if (!content) {
        throw new ApiError(401, "Content is Required")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet does't exist")
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(402, "Only owner can update tweets")
    }

    const updateTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set: {
                content
            }
        },
        {
            new:true
        }
    )

    if (!updateTweet) {
        throw new ApiError(500, "Failed to edit tweet please try again");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200,updateTweet, "Tweet has been updated successfully")
        )
})

const deleteTweet=asyncHandler(async(req,res)=>{
    const { tweetId } = req.params

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet does't exist")
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(402, "Only owner can delete tweets")
    }

    const deleteTweet=await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(new ApiResponse(200, {tweetId}, "Tweet deleted successfully"));


})

const getAllTweets=asyncHandler(async(req,res)=>{
    const {userId}=req.params

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400,"Not a valid user")
    }

    const tweets=await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }

        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerdetails",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            "avatar.url":1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likedetails"
            }
        },
        {
            $addFields:
            {
                likescount:{
                    $size:"$likedetails"
                },
                isliked:{
                    $cond:{
                        if:{
                            $in:[req.user?._id,"$likedetails.likeBy"]
                        },
                        then:true,
                        else:false
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
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            },
        },
        
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));


})
export { 
    createTweet,
    updateTweet,
    deleteTweet,
    getAllTweets
}