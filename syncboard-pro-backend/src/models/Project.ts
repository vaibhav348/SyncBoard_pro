import mongoose from "mongoose";
import { Schema } from "mongoose"; 

export interface IProject extends Document {
    name: string;
    description: string;
    companyId: mongoose.Types.ObjectId;  
    project_owner: mongoose.Types.ObjectId;      
    members: mongoose.Types.ObjectId[]; 
}

const ProjectSchema = new Schema<IProject>({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: "Company", 
        required: true
    },
    project_owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
            
        }
    ]
})

const Project = mongoose.model<IProject>("Project", ProjectSchema);
export default Project