import mongoose, { Schema, Document } from "mongoose";

export interface IStoryComment extends Document {
  storyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
}

const StoryCommentSchema = new Schema<IStoryComment>({
  storyId: {
    type: Schema.Types.ObjectId,
    ref: "UserStory",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model<IStoryComment>("StoryComment", StoryCommentSchema);
