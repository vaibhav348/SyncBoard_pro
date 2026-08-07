import mongoose, { Schema, Document } from "mongoose";

export interface ITaskComment extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;   
  content: string;                  
}

const TaskCommentSchema = new Schema<ITaskComment>({
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  userId: {                          
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {                         
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.model<ITaskComment>("TaskComment", TaskCommentSchema);