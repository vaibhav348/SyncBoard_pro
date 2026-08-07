import z from "zod";
import { Response, Request } from "express";
import Task from "../models/Task";
import TaskComment from "../models/TaskComment";
import mongoose from "mongoose";
const CreateCommentSchema = z.object({
    taskId: z.string().min(1, "Task ID is required"),
    text: z.string().min(1, "Comment text cannot be empty")
});

const UpdateCommentSchema = z.object({
    text: z.string().min(1, "Comment text cannot be empty")
});


export const createTaskComment = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" })
        }



        const validation = CreateCommentSchema.safeParse(req.body);
        if (!validation.success) return res.status(400).json({ errors: validation.error.issues });

        const { taskId, text } = validation.data;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const newComment = await TaskComment.create({
            taskId: new mongoose.Types.ObjectId(taskId),
            userId: new mongoose.Types.ObjectId(user.id),
            content: text
        })

        const populatedComment = await newComment.populate("userId", "name email role");

        return res.status(201).json({ message: "Comment added successfully", comment: populatedComment });


    } catch (error) {
        console.log("error while create task comment", error);
        return res.status(400).json({ message: "error while create task comment", error })
    }
}

export const getTaskComments = async(req: Request, res : Response)=>{
    try {
        const taskId = req.params.taskId as string;
        if (!taskId) return res.status(400).json({ message: "Task ID parameter is required" });
    
        // Oldest comments first taaki chat sequence sahi rahe (createdAt: 1)
        const comments = await TaskComment.find({ taskId: new mongoose.Types.ObjectId(taskId) })
          .populate("userId", "name email role")
          .sort({ createdAt: 1 });
    
        return res.status(200).json(comments);
      } catch (error: any) {
        return res.status(500).json({ message: "Error fetching comments: " + error.message });
      }
}

export const updateTaskComment = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const commentId = req.params.commentId as string;
  
      const validation = UpdateCommentSchema.safeParse(req.body);
      if (!validation.success) return res.status(400).json({ errors: validation.error.issues });
  
      const comment = await TaskComment.findById(commentId);
      if (!comment) return res.status(404).json({ message: "Comment not found" });
  
      const currentUserId = user?.id ?? user?._id;
      const normalizedRole = (user?.role ?? '').toLowerCase();
      const isPrivileged = normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'superadmin';
      const isAuthor = Boolean(currentUserId && comment.userId?.toString() === currentUserId.toString());

      if (!isAuthor && !isPrivileged) {
        return res.status(403).json({ message: "You don't have permission to edit this comment." });
      }
  
      comment.content = validation.data.text;
      await comment.save();
  
      return res.status(200).json({ message: "Comment updated successfully", comment });
    } catch (error: any) {
      return res.status(500).json({ message: "Error updating comment: " + error.message });
    }
  };

  export const deleteTaskComment = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const commentId = req.params.commentId as string;
  
      const comment = await TaskComment.findById(commentId);
      if (!comment) return res.status(404).json({ message: "Comment not found" });
  
      const currentUserId = user?.id ?? user?._id;
      const isAuthor = Boolean(currentUserId && comment.userId.toString() === currentUserId.toString());
      const isPrivileged = user.role === "owner" || user.role === "manager" || user.role === "superadmin";
  
      if (!isAuthor && !isPrivileged) {
        return res.status(403).json({ message: "You don't have permission to delete this comment." });
      }
  
      await TaskComment.findByIdAndDelete(commentId);
      return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: "Error deleting comment: " + error.message });
    }
  };