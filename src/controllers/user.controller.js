import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { application } from "express"
import mongoose from "mongoose"

//method for tokens genarartion
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateaccesstoken()
        const refreshToken = await user.generaterefreshtoken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    // get user details from postman
    // validation - not empty
    // check if user already exist:username and email
    // check for images and avatar
    // upload them in cloudinary,avatar
    //create user object - create entry in db
    // remove password and refresh token field from response
    //check for user creation
    //return response


    // get user details validation
    const { fullName, email, username, password } = req.body
    console.log("email:", email);
    console.log("username:", username);

    if (
        [fullName, email, password, username].some((fields) => fields?.trim() === "")
    ) {
        throw new ApiError(400, "All fields required");

    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already existed")
    }
    console.log(req.files);

    //get the localpath of images
    // const avatarlocalPath = req.files?.avatar[0]?.path;
    //  avatar has a fisrt object i.e avatar[0]

    //   to avoid cannot read undefined error
    let avatarlocalPath
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarlocalPath = req.files.avatar[0].path
    }
    console.log("path", avatarlocalPath);


    let coverImagelocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImagelocalPath = req.files.coverImage[0].path
    }


    if (!avatarlocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    //upload images on cloudinary
    const avatar = await uploadOnCloudinary(avatarlocalPath)
    const coverImage = await uploadOnCloudinary(coverImagelocalPath)
    if (!avatar) {
        throw new ApiError(400, "Avatar is required")
    }

    //object creation
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //Mongodb ek id add kr deta h har entry ke sath so usko find krna
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Server failure !!")
    }

    //sending standard response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registerd successfully")
    )




})

const loginUser = asyncHandler(async (req, res) => {
    //req body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token genarate
    //send cookies  containing tokens

    //bringing data
    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "Username or email is required")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Password invalid")
    }



    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refershToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User LoggedIn Successfully"
            )
        )
})


const logoutUser = asyncHandler(async (req, res) => {

    /*      since we can't give a form to user to give details and
            we want access to user to create a middleware auth to 
            authenticate login and add user to req.body
    */

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})


//  refreshing access token

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingrefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(402, "Invalid refresh token")
        }

        if (incomingrefreshToken !== user?.refreshToken) {
            throw new ApiError(402, "Refresh Token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newrefreshToken } = await generateAccessAndRefereshTokens(user._id)

        return res
            .status(200)
            .cookie("accesstoken", accessToken, options)
            .cookie("refreshtoken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newrefreshToken },
                    "Access Token Refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh Token")
    }
})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.
        status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "current user fetched successfully")
})

const updateUserCreadentials = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!(fullName || email)) {
        throw new ApiError(402, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password")
    return res
        .status(200)
        .json(new ApiResponse(200, user, "creadentials Update successful"))
})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocal = req.file?._id

    if (!avatarLocal) {
        throw new ApiError(400, "Avatar file Missing")
    }

    const avatar = uploadOnCloudinary(avatarLocal)

    if (!avatar.url) {
        throw new ApiError(401, "Error while uploading on Avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    },
        {
            new: true
        }
    )
    return res
        .status(200)
        .json(new ApiResponse(200, user, "avatar updated successsfully"))

})
const updateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocal = req.file?._id

    if (!coverImageLocal) {
        throw new ApiError(400, "cover Image file Missing")
    }

    const coverImage = uploadOnCloudinary(avatarLocal)

    if (!coverImage.url) {
        throw new ApiError(401, "Error while uploading on coverImage")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "coverImage updated successsfully")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params // taking data from url

    if (!username) {
        throw new ApiError(401, "Username not found")

    }

    const channel = User.aggregate([
        {
            // match finds the documents required

            $match: {
                username: username?.toLowerCase()
            }
        },
        // now we are in the username model

        // lookup is for finding fields and joining the models

        //  this lookup is for finding usernames subscriber from subscription model 
        {
            $lookup: {
                from: "subscriptions",  //Subscription is from model name in at last export
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"

            }
        },
        //  this lookup is for finding to whom username is subscribed to from subscription model 

        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            // addfields add the new fields to the existing object
            $addFields: {
                subscriberCount: {
                    // size count the number of models here created
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubsribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            // projects the fields we need
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubsribed: 1


            }
        }
    ])

    // channel or aggregate return an array from their we need the first object
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )
})
const getWatchhistory = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
       throw new ApiError(405,"UserId is required")
    }

    // Ensure user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
       throw new ApiError(406,"Invalid user ID.")
    }
    const user = await User.aggregate([
        {
            $match: {
                // _id:req.user._id     
                /* this is wrong cuz here mongodb pipeline goes directly to mongodb
                    but in other case mongoose convert the string that we are getting
                    from req.user._id to actual mongodb id
                */
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            // this is for finding the videos
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                // this is for fnding owner or user
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
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
                        // this is done to get object of array recieved form owner
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        )
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateUserCreadentials,
    getUserChannelProfile,
    updateAvatar,
    updateCoverImage,getWatchhistory
}