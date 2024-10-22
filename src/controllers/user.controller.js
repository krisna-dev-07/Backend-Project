import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

//method for tokens genarartion
const genarateAccessAndRefreshToken = async (UserId) => {
    try {
        const user = User.findById(UserId)
        const accessToken = user.generateaccesstoken()
        const refreshToken = user.generaterefreshtoken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Server issue")
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

    if (!username || !email) {
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



    const { accessToken, refreshToken } = await genarateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refershToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshTokenToken, options)
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


const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
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
        .json(new ApiResponse(200,{},"User Logged Out successfully"))
})
export { registerUser, loginUser, logOutUser }