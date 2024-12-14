import mongoose,{Schema} from "mongoose";

const likesSchema=Schema({
    comment:{
        type:Schema.Types.ObjectId,
        ref:"Comments"
    },
    video:{
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    likedBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    tweet:{
        type:Schema.Types.ObjectId,
        ref:"Tweet"
    }
},
{
    timestamps:true
})

export const LikedBy=mongoose.model("LikedBy",likesSchema)