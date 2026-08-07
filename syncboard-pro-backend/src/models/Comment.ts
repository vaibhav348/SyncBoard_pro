import mongoose, {  Schema } from "mongoose"; 

export interface IComment extends Document{
    issueId : mongoose.Types.ObjectId,
    userId : mongoose.Types.ObjectId,
    content: string,
}

const CommentSchema = new Schema<IComment>({
    issueId:{
        type : mongoose.Types.ObjectId,
        ref : "Issue",
        required : true,
    },
    userId:{
        type : mongoose.Types.ObjectId,
        ref : "User",
        required : true,
    },
    content : {
        type : String,
        required : true
    }
},{
    timestamps : true
})


export default  mongoose.model<IComment>("Comment", CommentSchema)