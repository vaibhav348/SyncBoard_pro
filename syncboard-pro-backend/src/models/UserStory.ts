import mongoose, { Schema, Document } from "mongoose";

export interface IUserStory extends Document {
  projectId: mongoose.Types.ObjectId;
  sprintId: mongoose.Types.ObjectId | null;
  assignee?: mongoose.Types.ObjectId | null; // 👈 Naya Add Kiya
  createdBy?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  storyPoints: number;
  position: number;
}

const UserStorySchema = new Schema<IUserStory>({
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  },
  sprintId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Sprint', 
    default: null 
  },
  assignee: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', // Aapke User model ka name
    default: null 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    default: null 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  storyPoints: { 
    type: Number, 
    default: 0 
  },
  position: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

export default mongoose.model<IUserStory>("UserStory", UserStorySchema);