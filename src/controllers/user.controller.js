import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
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

    //get the localpath of images
    const avatarlocalPath = req.files?.avatar[0]?.path;
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
        throw new ApiError(500,"Server failure !!")
    }

    //sending standard response
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registerd successfully")
    )




})

export { registerUser }