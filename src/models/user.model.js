import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true

        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,    //  cloudinary url
            required: true
        },
        coverImage: {
            type: String
        },
        watchHistory: [{
            type: Schema.Types.ObjectId,
            ref: "video"
        }
        ],
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        refreshToken: {
            type: String
        }
    }, { timestamps: true }
)
// pre hook is a method run just before your data is save

// callback function must not bearrow fn cuz it don't have access to this

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();    
    
    //isModified checks any field is modified or not

    this.password = await bcrypt.hash(this.password, 10)
    next()
}
)

userSchema.methods.isPasswordCorrect = async function
    (password) {
    return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateaccesstoken = async function () {
    const token = jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
        process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
    // console.log("Generated Access Token:", token); // Log the token
    return token;
};

userSchema.methods.generaterefreshtoken = async function () {
    return jwt.sign({
        _id: this._id

    },
        process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User = mongoose.model("User", userSchema)