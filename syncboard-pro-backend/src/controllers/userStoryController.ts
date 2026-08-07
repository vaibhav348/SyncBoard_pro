import z from "zod";
import { Response, Request } from "express";
import Sprint from "../models/Sprint";
import UserStory from "../models/UserStory";
import Task from "../models/Task";
import Issue from "../models/Issue";
import StoryComment from "../models/StoryComment";
import mongoose from "mongoose";

const CreateStorySchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
    title: z.string().min(2, "Title should be at least 2 characters long"),
    description: z.string().optional(),
    storyPoints: z.number().nonnegative().optional().default(0),
    sprintId: z.string().nullable().optional(),
    assignee: z.string().nullable().optional()
});

const MoveStorySchema = z.object({
    sprintId: z.string().nullable() // Target sprint id ya backlog ke liye null
});

const UpdateStorySchema = z.object({
    title: z.string().min(2, "Title should be at least 2 characters long").optional(),
    description: z.string().optional(),
    storyPoints: z.number().nonnegative().optional(),
    assignee: z.string().nullable().optional(),
});

export const createStory = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        console.log("Logged in user details:", user);
        
        if (!user) {
            return res.status(401).json("unauthorized");
        }
        if (user.role === "employee") {
            return res.status(403).json({ message: "Employees do not have permission to create user stories" });
        }

        const validation = CreateStorySchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }

        const { projectId, title, description, storyPoints, sprintId, assignee } = validation.data;

        if (sprintId) {
          const sprintExists = await Sprint.findById(sprintId);
          if (!sprintExists) {  
            return res.status(404).json({ message: "Assigned sprint not found" });
          }
        }

        const newStory = await UserStory.create({
            projectId,
            title,
            description,
            storyPoints,
            sprintId: sprintId || null,
            assignee: assignee || null,
            createdBy: user.id ? new mongoose.Types.ObjectId(user.id) : undefined
        })
        await newStory.populate('assignee', 'name email avatar');

        return res.status(200).json({ message: "userStory created successfully", story: newStory })



    } catch (error) {
        console.error("Error in startSprint:", error);
        return res.status(500).json({ message: "Server error while creating story of sprint: " + error });
    }
}


export const getBacklogStories = async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      if (!projectId) return res.status(400).json({ message: "Project ID is required" });
  
      const stories = await UserStory.find({ projectId, sprintId: null })
      .populate('assignee', 'name email avatar') // 👈 Assignee ki basic details frontend ko bhejne ke liye
      .sort({ position: 1 });   
  
      return res.status(200).json(stories);
    } catch (error: any) {
      return res.status(500).json({ message: "Server error while fetching backlog: " + error.message });
    }
  };


  export const getStoriesBySprint = async (req: Request, res: Response) => {
    try {
      const { sprintId } = req.params;
      if (!sprintId) return res.status(400).json({ message: "Sprint ID is required" });
  
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) return res.status(404).json({ message: "Sprint not found" });
  
      const stories = await UserStory.find({ sprintId })
      .populate('assignee', 'name email avatar') // 👈 Assignee Details Populated
      .sort({ position: 1 });
      
      const storiesWithMetrics = await Promise.all(
        stories.map(async (story) => {
          const totalTasks = await Task.countDocuments({ storyId: story._id });
          const doneTasks = await Task.countDocuments({ storyId: story._id, status: "Done" });
          
          return {
            ...story.toObject(),
            totalTasks,
            doneTasks
          };
        })
      );
  
      return res.status(200).json(storiesWithMetrics);
    } catch (error: any) {
      return res.status(500).json({ message: "Server error while fetching sprint stories: " + error.message });
    }
  };



  export const getStoryById = async (req: Request, res: Response) => {
    try {
      const storyId = req.params.storyId as string;
      if (!storyId) return res.status(400).json({ message: "Story ID is required" });

      const story = await UserStory.findById(storyId)
        .populate("assignee", "name email avatar")
        .populate("sprintId", "name");

      if (!story) return res.status(404).json({ message: "User Story not found" });

      return res.status(200).json({ story });
    } catch (error: any) {
      return res.status(500).json({ message: "Server error while fetching story: " + error.message });
    }
  };

  export const updateStory = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const normalizedRole = (user.role ?? '').toLowerCase();
      const isPrivileged = normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'superadmin';
      if (!isPrivileged) {
        return res.status(403).json({ message: "Employees do not have permission to update user stories" });
      }

      const storyId = req.params.storyId as string;
      const validation = UpdateStorySchema.safeParse(req.body);
      if (!validation.success) return res.status(400).json({ errors: validation.error.issues });

      const story = await UserStory.findById(storyId);
      if (!story) return res.status(404).json({ message: "User Story not found" });

      const { title, description, storyPoints, assignee } = validation.data;

      if (title !== undefined) story.title = title;
      if (description !== undefined) story.description = description;
      if (storyPoints !== undefined) story.storyPoints = storyPoints;
      if (assignee !== undefined) {
        story.assignee = assignee ? new mongoose.Types.ObjectId(assignee) : null;
      }

      await story.save();

      const populatedStory = await UserStory.findById(storyId)
        .populate("assignee", "name email avatar")
        .populate("sprintId", "name");

      return res.status(200).json({ message: "Story updated successfully", story: populatedStory });
    } catch (error: any) {
      return res.status(500).json({ message: "Server error while updating story: " + error.message });
    }
  };


   // 4. MOVE STORY TO SPRINT / BACKLOG (Fixed TypeScript Types & Array Clash)
export const moveStoryToSprint = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user?.role === "employee") return res.status(403).json({ message: "Forbidden" });
  
      // FIX: TypeScript ko explicitly bataya ki ye sirf string hai, array nahi
      const storyId = req.params.storyId as string;
  
      const validation = MoveStorySchema.safeParse(req.body);
      if (!validation.success) return res.status(400).json({ errors: validation.error.issues });
  
      const { sprintId } = validation.data; // Ye 'string | null' hai
  
      // String ko proper Mongoose ObjectId mein convert karo (agar null nahi hai toh)
      const targetSprintId = sprintId ? new mongoose.Types.ObjectId(sprintId) : null;
      
      // Ab yahan array wala error nahi aayega kyunki storyId ko string ghoshit kar diya hai
      const targetStoryId = new mongoose.Types.ObjectId(storyId);
  
      const story = await UserStory.findById(targetStoryId);
      if (!story) return res.status(404).json({ message: "User Story not found" });
  
      if (targetSprintId) {
        const sprint = await Sprint.findById(targetSprintId);
        if (!sprint) return res.status(404).json({ message: "Target Sprint not found" });
      }
  
      // Story target update karo
      story.sprintId = targetSprintId;
      await story.save();
  
      // Child tasks ko bhi update karo
      const updatedTasks = await Task.updateMany(
        { storyId: targetStoryId },
        { $set: { sprintId: targetSprintId } }
      );
  
      return res.status(200).json({
        message: "Story moved successfully and child tasks synchronized.",
        story,
        tasksSynced: updatedTasks.modifiedCount
      });
    } catch (error: any) {
      return res.status(500).json({ message: "Server error during migration: " + error.message });
    }
  };

  export const deleteStory = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { storyId } = req.params;

      const story = await UserStory.findById(storyId);
      if (!story) return res.status(404).json({ message: "User Story not found" });

      const currentUserId = user?.id ?? user?._id;
      const normalizedRole = (user?.role ?? '').toLowerCase();
      const isPrivileged = normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'superadmin';
      const isCreator = Boolean(currentUserId && story.createdBy && story.createdBy.toString() === currentUserId.toString());

      if (!isPrivileged && !isCreator) {
        return res.status(403).json({ message: "You don't have permission to delete this story." });
      }
  
      // Find all target child tasks
      const tasks = await Task.find({ storyId });
      const taskIds = tasks.map(t => t._id);
  
      // 1. In child tasks ke andar jitne bhi Issues/Bugs nikaale the, unka taskId null karo
      await Issue.updateMany(
        { taskId: { $in: taskIds } },
        { $set: { taskId: null } }
      );
  
      // 2. Tasks ko mass-delete karo
      await Task.deleteMany({ storyId });

      // 3. Story comments delete karo
      await StoryComment.deleteMany({ storyId });

      // 4. Last mein core Story udaao
      await UserStory.findByIdAndDelete(storyId);
  
      return res.status(200).json({ message: "User Story and dependent cascade elements cleaned successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: "Server error on cascading deletion: " + error.message });
    }
  };