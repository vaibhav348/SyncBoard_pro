import mongoose from "mongoose";
import { Schema } from "mongoose";

export interface ISprint extends Document{
    projectId:mongoose.Types.ObjectId | null;
    name: string;
    goal : string;
    startDate?: Date;
    endDate?: Date;
    status: "planned" | "active" | "completed";
    createdBy?: mongoose.Types.ObjectId;
    completedAt?: Date;
}

const SprintSchema = new Schema<ISprint>({
    projectId:{
        type : Schema.Types.ObjectId,
        ref : 'Project',
        required:true
    },
    name :{
        type : String,
        required: true
    },
    goal:{
        type: String,
    },
    startDate:{
        type:Date
    },
    endDate:{
        type:Date
    },
    status:{
        type: String,
        enum:["planned","active","completed"],
        default:"planned"
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    completedAt:{
        type: Date,
        default: null
    }
},{ timestamps:true})

const Sprint = mongoose.model<ISprint>("Sprint", SprintSchema);
export default Sprint;