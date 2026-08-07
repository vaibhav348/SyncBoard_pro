import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  storyId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;    
  companyId: mongoose.Types.ObjectId;   
  sprintId: mongoose.Types.ObjectId | null; 
  title: string;
  description?: string;
  status: "Todo" | "In-Progress" | "Review" | "Done";
  priority: "Low" | "Medium" | "High";  
  assignedTo?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  position: number;
}

const TaskSchema = new Schema<ITask>({
  storyId: {
    type: Schema.Types.ObjectId,
    ref: 'UserStory',
    required: true
  },
  projectId: {                          
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  companyId: {                          
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  sprintId: {                            
    type: Schema.Types.ObjectId,
    ref: 'Sprint',
    default: null
  },
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ["Todo", "In-Progress", "Review", "Done"],
    default: "Todo"
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],  
    default: "Medium"
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  position: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<ITask>("Task", TaskSchema);