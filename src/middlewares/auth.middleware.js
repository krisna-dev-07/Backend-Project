import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken"
import User from "../db/index.js"

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")

    try {
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            //Todo : discuss about frontend
            throw new ApiError(401,"Invalid Access Token")
        } 
    
        req.user=user;
    
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invaid Token")
    }


})