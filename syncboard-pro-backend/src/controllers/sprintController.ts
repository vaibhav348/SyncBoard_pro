import { Request, Response } from "express";
import mongoose from "mongoose";
import z from "zod";
import Sprint from "../models/Sprint";
import Task from "../models/Task";
import Issue from "../models/Issue";
import UserStory from "../models/UserStory";
import Project from "../models/Project";
import { canManageSprint } from "../utils/sprintAuthorization";

// --- ZOD SCHEMAS FOR VALIDATION ---

const CreateSprintSchema = z.object({
   projectId: z.string().min(1, "Project ID is required"),
   name: z.string().min(2, "Name should be at least 2 characters long"),
   goal: z.string().min(2, "Goal should be at least 2 characters long").optional(),
   startDate: z.coerce.date().optional(),
   endDate: z.coerce.date().optional()
});

const StartSprintSchema = z.object({
   projectId: z.string().min(1, "Project ID is required"),
   startDate: z.coerce.date().optional(),
   endDate: z.coerce.date().optional()
}).strict();

const CompleteSprintSchema = z.object({
   moveIncompleteTo: z.enum(["backlog", "sprint"]).default("backlog"),
   targetSprintId: z.string().min(1).optional()
}).strict();

const UpdateSprintSchema = z.object({
   name: z.string().min(2, "Sprint name should be at least 2 characters long").optional(),
   goal: z.string().optional(),
   startDate: z.coerce.date().optional(),
   endDate: z.coerce.date().optional()
}).strict();

const getIncompleteStatusFilter = () => ({
   status: { $nin: ["Done", "done", "Completed", "completed", "Closed", "closed"] as string[] }
}) as Record<string, any>;

const resolveUserId = (user: any) => user?._id ?? user?.id ?? null;

// --- CONTROLLER FUNCTIONS ---

// 1. CREATE SPRINT
export const createSprint = async (req: Request, res: Response) => {
   try {
       const user = (req as any).user;

       if (!user) {
           return res.status(401).json({ message: "Unauthorized: No token provided" });
       }

       const role = String(user.role || "").toLowerCase();
       if (role === "employee") {
           return res.status(403).json({ message: "Employee role does not have permission to create a sprint" });
       }

       const validation = CreateSprintSchema.safeParse(req.body);
       if (!validation.success) {
           return res.status(400).json({ errors: validation.error.issues });
       }

       const { projectId, name, goal, startDate, endDate } = validation.data;
       const project = await Project.findById(projectId);
       if (!project) {
           return res.status(404).json({ message: "Project not found" });
       }

       const newSprint = await Sprint.create({
           projectId,
           name,
           goal,
           startDate,
           endDate,
           status: "planned",
           createdBy: resolveUserId(user)
       });

       return res.status(201).json({
           message: "Sprint created successfully",
           sprint: newSprint
       });

   } catch (error: any) {
       console.error("Error in createSprint:", error);
       return res.status(500).json({ message: "Server error while creating sprint: " + error.message });
   }
};

// 2. GET ALL SPRINTS FOR A PROJECT
export const getAllSprints = async (req: Request, res: Response) => {
   try {
       const user = (req as any).user;
       if (!user) return res.status(401).json({ message: "Unauthorized" });

       const { projectId } = req.params;
       if (!projectId) {
           return res.status(400).json({ message: "Project ID parameter is required" });
       }

       const sprints = await Sprint.find({ projectId }).sort({ createdAt: -1 });
       return res.status(200).json(sprints);

   } catch (error: any) {
       console.error("Error in getAllSprints:", error);
       return res.status(500).json({ message: "Server error while fetching sprints: " + error.message });
   }
};

export const updateSprint = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        const { sprintId } = req.params;
        const validation = UpdateSprintSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }

        const sprint = await Sprint.findById(sprintId);
        if (!sprint) {
            return res.status(404).json({ message: "Sprint not found" });
        }

        const project = await Project.findById(sprint.projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const projectLike = project ? { ...project.toObject(), _id: String(project._id) } as any : null;
        const sprintLike = sprint ? { ...sprint.toObject(), _id: String(sprint._id) } as any : null;

        if (!canManageSprint(user, projectLike, sprintLike)) {
            return res.status(403).json({ message: "You do not have permission to manage this sprint" });
        }

        const { name, goal, startDate, endDate } = validation.data;
        if (startDate || endDate || sprint.startDate || sprint.endDate) {
            const resolvedStartDate = startDate ? new Date(startDate) : sprint.startDate ? new Date(sprint.startDate) : undefined;
            const resolvedEndDate = endDate ? new Date(endDate) : sprint.endDate ? new Date(sprint.endDate) : undefined;
            if (resolvedStartDate && resolvedEndDate && resolvedEndDate < resolvedStartDate) {
                return res.status(400).json({ message: "Sprint end date cannot be before the start date" });
            }
        }

        if (name) sprint.name = name;
        if (typeof goal === 'string') sprint.goal = goal;
        if (startDate) sprint.startDate = new Date(startDate);
        if (endDate) sprint.endDate = new Date(endDate);
        await sprint.save();

        return res.status(200).json({ message: "Sprint updated successfully", sprint });
    } catch (error: any) {
        console.error("Error in updateSprint:", error);
        return res.status(500).json({ message: "Server error while updating sprint: " + error.message });
    }
};

// 3. START SPRINT (The Only-One-Active Check)
export const startSprint = async (req: Request, res: Response) => {
   try {
       const user = (req as any).user;
       if (!user) return res.status(401).json({ message: "Unauthorized" });

       const { sprintId } = req.params;
       const validation = StartSprintSchema.safeParse(req.body);
       if (!validation.success) {
           return res.status(400).json({ errors: validation.error.issues });
       }

       const { projectId, startDate, endDate } = validation.data;
       const project = await Project.findById(projectId);
       if (!project) {
           return res.status(404).json({ message: "Project not found" });
       }

       const sprint = await Sprint.findById(sprintId);
       if (!sprint) {
           return res.status(404).json({ message: "Sprint not found" });
       }

       const projectLike = project ? { ...project.toObject(), _id: String(project._id) } as any : null;
       const sprintLike = sprint ? { ...sprint.toObject(), _id: String(sprint._id) } as any : null;

       if (!canManageSprint(user, projectLike, sprintLike)) {
           return res.status(403).json({ message: "You do not have permission to manage this sprint" });
       }

       const existingActive = await Sprint.findOne({ projectId, status: "active", _id: { $ne: sprintId } });
       if (existingActive) {
           return res.status(400).json({
               message: `Sprint '${existingActive.name}' is already active. Please complete it before starting a new one.`
           });
       }

       if (sprint.status !== "planned") {
           return res.status(400).json({ message: `Cannot start a sprint that is already ${sprint.status}` });
       }

       const resolvedStartDate = startDate ? new Date(startDate) : sprint.startDate ? new Date(sprint.startDate) : new Date();
       let resolvedEndDate = endDate ? new Date(endDate) : sprint.endDate ? new Date(sprint.endDate) : null;

       if (!resolvedEndDate) {
           const fallbackEndDate = new Date(resolvedStartDate);
           fallbackEndDate.setDate(fallbackEndDate.getDate() + 7);
           resolvedEndDate = fallbackEndDate;
       }

       if (resolvedEndDate < resolvedStartDate) {
           return res.status(400).json({ message: "Sprint end date cannot be before the start date" });
       }

       sprint.status = "active";
       sprint.startDate = resolvedStartDate;
       sprint.endDate = resolvedEndDate;
       sprint.completedAt = undefined;
       await sprint.save();

       return res.status(200).json({ message: "Sprint started successfully", sprint });

   } catch (error: any) {
       console.error("Error in startSprint:", error);
       return res.status(500).json({ message: "Server error while starting sprint: " + error.message });
   }
};

// 4. COMPLETE SPRINT (The Cleanup Execution)
export const completeSprint = async (req: Request, res: Response) => {
   try {
       const user = (req as any).user;
       if (!user) return res.status(401).json({ message: "Unauthorized" });

       const { sprintId } = req.params;
       const validation = CompleteSprintSchema.safeParse(req.body);
       if (!validation.success) {
           return res.status(400).json({ errors: validation.error.issues });
       }

       const { moveIncompleteTo, targetSprintId } = validation.data;
       const sprint = await Sprint.findById(sprintId);
       if (!sprint) {
           return res.status(404).json({ message: "Sprint not found" });
       }

       const project = await Project.findById(sprint.projectId);
       if (!project) {
           return res.status(404).json({ message: "Project not found" });
       }

       const projectLike = project ? { ...project.toObject(), _id: String(project._id) } as any : null;
       const sprintLike = sprint ? { ...sprint.toObject(), _id: String(sprint._id) } as any : null;

       if (!canManageSprint(user, projectLike, sprintLike)) {
           return res.status(403).json({ message: "You do not have permission to manage this sprint" });
       }

       if (sprint.status !== "active") {
           return res.status(400).json({ message: "Only active sprints can be completed" });
       }

       if (moveIncompleteTo === "sprint") {
           if (!targetSprintId) {
               return res.status(400).json({ message: "A target sprint is required when moving incomplete work to a sprint" });
           }
           const targetSprint = await Sprint.findById(targetSprintId);
           if (!targetSprint || String(targetSprint.projectId) !== String(sprint.projectId)) {
               return res.status(400).json({ message: "Target sprint is invalid for this project" });
           }
       }

       const session = await mongoose.startSession();
       session.startTransaction();

       try {
           sprint.status = "completed";
           sprint.endDate = sprint.endDate ?? new Date();
           sprint.completedAt = new Date();
           await sprint.save({ session });

           const rolloverTargetId = moveIncompleteTo === "sprint" ? targetSprintId : null;
           const rolloverValue = rolloverTargetId ? new mongoose.Types.ObjectId(rolloverTargetId) : null;

           const incompleteFilter = getIncompleteStatusFilter();

           const [tasksResult, issuesResult, storiesResult] = await Promise.all([
               Task.updateMany(
                   { sprintId: sprint._id, ...incompleteFilter },
                   { $set: { sprintId: rolloverValue } },
                   { session }
               ),
               Issue.updateMany(
                   { sprintId: sprint._id, ...incompleteFilter },
                   { $set: { sprintId: rolloverValue } },
                   { session }
               ),
               UserStory.updateMany(
                   { sprintId: sprint._id, ...incompleteFilter },
                   { $set: { sprintId: rolloverValue } },
                   { session }
               )
           ]);

           await session.commitTransaction();
           session.endSession();

           return res.status(200).json({
               message: "Sprint completed successfully.",
               sprint,
               rollover: {
                   moveIncompleteTo,
                   targetSprintId: rolloverTargetId ?? null,
                   movedTasks: tasksResult.modifiedCount,
                   movedIssues: issuesResult.modifiedCount,
                   movedStories: storiesResult.modifiedCount
               }
           });
       } catch (error) {
           await session.abortTransaction();
           session.endSession();
           throw error;
       }

   } catch (error: any) {
       console.error("Error in completeSprint:", error);
       return res.status(500).json({ message: "Server error while completing sprint: " + error.message });
   }
};

export const getSprintSummary = async (req: Request, res: Response) => {
   try {
       const user = (req as any).user;
       if (!user) return res.status(401).json({ message: "Unauthorized" });

       const { sprintId } = req.params;
       const sprint = await Sprint.findById(sprintId);
       if (!sprint) {
           return res.status(404).json({ message: "Sprint not found" });
       }

       const project = await Project.findById(sprint.projectId);
       if (!project) {
           return res.status(404).json({ message: "Project not found" });
       }

       const projectLike = project ? { ...project.toObject(), _id: String(project._id) } as any : null;
       const sprintLike = sprint ? { ...sprint.toObject(), _id: String(sprint._id) } as any : null;

       if (!canManageSprint(user, projectLike, sprintLike)) {
           return res.status(403).json({ message: "You do not have permission to view this sprint summary" });
       }

       const [tasks, issues, stories] = await Promise.all([
           Task.find({ sprintId: sprint._id }),
           Issue.find({ sprintId: sprint._id }),
           UserStory.find({ sprintId: sprint._id })
       ]);

       const doneTasks = tasks.filter((task) => ["Done", "done", "Completed", "completed", "Closed", "closed"].includes(String(task.status))).length;
       const pendingTasks = tasks.length - doneTasks;
       const doneIssues = issues.filter((issue) => ["Done", "done", "Completed", "completed", "Closed", "closed"].includes(String(issue.status))).length;
       const pendingIssues = issues.length - doneIssues;
       const totalStoryPoints = stories.reduce((sum, story) => sum + ((story as any).storyPoints ?? 0), 0);
       const completedStoryPoints = stories.filter((story) => ["Done", "done", "Completed", "completed", "Closed", "closed"].includes(String((story as any).status ?? ""))).reduce((sum, story) => sum + ((story as any).storyPoints ?? 0), 0);

       return res.status(200).json({
           sprint,
           counts: {
               tasks: tasks.length,
               doneTasks,
               pendingTasks,
               issues: issues.length,
               doneIssues,
               pendingIssues
           },
           storyPoints: {
               total: totalStoryPoints,
               completed: completedStoryPoints,
               remaining: totalStoryPoints - completedStoryPoints
           },
           velocity: {
               completionRate: tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0,
               issueCompletionRate: issues.length > 0 ? Math.round((doneIssues / issues.length) * 100) : 0
           }
       });
   } catch (error: any) {
       console.error("Error in getSprintSummary:", error);
       return res.status(500).json({ message: "Server error while fetching sprint summary: " + error.message });
   }
};