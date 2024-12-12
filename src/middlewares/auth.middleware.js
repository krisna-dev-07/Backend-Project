import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
export const verifyJWT = asyncHandler(async (req, _, next) => {
    // console.log("Headers:", req.headers); // Log all headers
    // console.log("Cookies:", req.cookies); // Log all cookies

    // req has access to cookies due to cookie-parser
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    // replace bearer cuz it's suffix to access token from Authorization header
    console.log("Retrieved token:", token); // Log the retrieved token

    if (!token || typeof token !== 'string') {
        throw new ApiError(401, "Unauthorized request: Token is missing or invalid");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // checking the access token
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("JWT verification error:", error);
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
