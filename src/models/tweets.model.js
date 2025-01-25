import mongoose,{Schema} from "mongoose";

const tweetschema=Schema({
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },

    content:{
        type:String,
        require:true
    }
},{timestamps: true}
)

export const Tweet=mongoose.model("Tweet",tweetschema)