import mongoose, { Schema } from mongoose

const commentSchema = new Schema({
    content:{
        type:String,
        required: true
    },
    video:{
        type:Schema.Types.objectId,
        ref:"Video"
    },
    owner:{
         type:Schema.Types.objectId,
        ref:"User"
    }

},{ timestams: true }
    
)

commentSchema.plugin(mongooseAggregatePaginate)

export const Comments = mongoose.model("Comments", commentSchema)