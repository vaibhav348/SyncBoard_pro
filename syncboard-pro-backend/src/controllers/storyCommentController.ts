import z from "zod";
import { Response, Request } from "express";
import UserStory from "../models/UserStory";
import StoryComment from "../models/StoryComment";
import mongoose from "mongoose";

const CreateCommentSchema = z.object({
  storyId: z.string().min(1, "Story ID is required"),
  text: z.string().min(1, "Comment text cannot be empty"),
});

export const createStoryComment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validation = CreateCommentSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ errors: validation.error.issues });

    const { storyId, text } = validation.data;

    const story = await UserStory.findById(storyId);
    if (!story) return res.status(404).json({ message: "Story not found" });

    const newComment = await StoryComment.create({
      storyId: new mongoose.Types.ObjectId(storyId),
      userId: new mongoose.Types.ObjectId(user.id),
      content: text,
    });

    const populatedComment = await newComment.populate("userId", "name email role");

    return res.status(201).json({ message: "Comment added successfully", comment: populatedComment });
  } catch (error: any) {
    return res.status(500).json({ message: "Error creating story comment: " + error.message });
  }
};

export const getStoryComments = async (req: Request, res: Response) => {
  try {
    const storyId = req.params.storyId as string;
    if (!storyId) return res.status(400).json({ message: "Story ID parameter is required" });

    const comments = await StoryComment.find({ storyId: new mongoose.Types.ObjectId(storyId) })
      .populate("userId", "name email role")
      .sort({ createdAt: 1 });

    return res.status(200).json(comments);
  } catch (error: any) {
    return res.status(500).json({ message: "Error fetching story comments: " + error.message });
  }
};
