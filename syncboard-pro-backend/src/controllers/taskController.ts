import { Request, Response } from "express"
import z from "zod";
import UserStory from "../models/UserStory";
import Task from "../models/Task";
import mongoose from "mongoose";
import Issue from "../models/Issue";
import TaskComment from "../models/TaskComment";


const CreateTaskSchema = z.object({
    storyId: z.string().min(1, "Story ID is required"),
    title: z.string().min(2, "Title should be at least 2 characters long"),
    description: z.string().optional(),
    priority: z.enum(["Low", "Medium", "High"]).optional().default("Medium"),
    assignedTo: z.string().optional()
});

const UpdateTaskSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["Todo", "In-Progress", "Review", "Done"]).optional(),
    priority: z.enum(["Low", "Medium", "High"]).optional(), // TaskSchema me Critical nahi h
    assignedTo: z.string().nullable().optional(), 
    position: z.number().optional(),
    storyId: z.string().optional(),
});

export const createTask = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ message: "unauthorized" })
        }
        const validation = CreateTaskSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }

        const { storyId, title, description, priority, assignedTo } = validation.data;

        // 1. Parent story dhoondo
        const story = await UserStory.findById(storyId);
        if (!story) {
            return res.status(404).json({ message: "Parent user story is not found" })
        }

        const taskCount = await Task.countDocuments({ storyId });

        // 2. Schema ki requirements nikaalo parent story aur logged-in user se
        const projectId = story.projectId;
        const companyId = user.companyId; // Make sure tumhara authMiddleware token se companyId req.user mein set karta ho

        // 3. Ab saare fields ke saath Task banao
        const newTask = await Task.create({
            storyId: new mongoose.Types.ObjectId(storyId),
            projectId: projectId,      // Add kiya (Required check pass)
            companyId: companyId,      // Add kiya (Required check pass)
            sprintId: story.sprintId,  // Auto-copy from story
            title,
            description,
            priority: priority as any,
            assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
            createdBy: user.id ? new mongoose.Types.ObjectId(user.id) : undefined,
            position: taskCount,
            status: "Todo"
        });

        await newTask.populate("createdBy", "name email role");
        await newTask.populate("assignedTo", "name email role");

        return res.status(201).json({ message: "Task create successfully", task: newTask });

    } catch (error: any) {
        console.log("error while create task", error);
        return res.status(500).json({ message: "Server error while creating task: " + error.message });
    }
}

export const getTasksByStory = async (req: Request, res: Response) => {
    try {
        const storyId = req.params.storyId as string;
        if (!storyId) return res.status(400).json({ message: "Story ID is required" });

        const tasks = await Task.find({ storyId: new mongoose.Types.ObjectId(storyId) })
            .populate("assignedTo", "name email role")
            .populate("createdBy", "name email role")
            .sort({ position: 1 });

        return res.status(200).json(tasks);
    } catch (error: any) {
        return res.status(500).json({ message: "Server error fetching tasks by story: " + error.message });
    }
};

// 3. GET TASKS BY SPRINT (Active Kanban Board View)
export const getTasksBySprint = async (req: Request, res: Response) => {
    try {
        const sprintId = req.params.sprintId as string;
        if (!sprintId) return res.status(400).json({ message: "Sprint ID is required" });

        const tasks = await Task.find({ sprintId: new mongoose.Types.ObjectId(sprintId) })
            .populate("assignedTo", "name email role")
            .populate("createdBy", "name email role")
            .populate("storyId", "title storyPoints") // Card par User story ka title dikhane ke liye
            .sort({ position: 1 });

        return res.status(200).json(tasks);
    } catch (error: any) {
        return res.status(500).json({ message: "Server error fetching active board tasks: " + error.message });
    }
};

export const getTasksById = async (req: Request, res: Response) => {
    try {
        const taskId = req.params.taskId as string;
        if (!taskId) return res.status(400).json({ message: "Task ID is required" });

        // const tasks = await Task.find({ sprintId: new mongoose.Types.ObjectId(sprintId) })
        const task = await Task.findById(taskId)
            .populate("assignedTo", "name email role")
            .populate("createdBy", "name email role")
            .populate("storyId", "title storyPoints") 

        return res.status(200).json(task);
    } catch (error: any) {
        return res.status(500).json({ message: "Server error fetching task: " + error.message });
    }
};


export const updateTask = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const taskId = req.params.taskId as string;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: "Invalid Task ID format" });
        }

        const validation = UpdateTaskSchema.safeParse(req.body);
        if (!validation.success) return res.status(400).json({ errors: validation.error.issues });

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        const currentUserId = user?.id ?? user?._id;
        const normalizedRole = (user?.role ?? '').toLowerCase();
        const isOwnerOrManager = normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'superadmin';
        const isCreator = Boolean(currentUserId && task.createdBy && task.createdBy.toString() === currentUserId.toString());
        const isAssignee = Boolean(currentUserId && task.assignedTo && task.assignedTo.toString() === currentUserId.toString());

        const requestedFields = Object.keys(validation.data);

        if (!isOwnerOrManager && !isCreator && !isAssignee) {
            return res.status(403).json({ message: "You don't have permission to update this task." });
        }

        if (!isOwnerOrManager && !isCreator && isAssignee) {
            const allowedFieldsForAssignee = ['status', 'storyId', 'position'];
            const isAllowedAccess = requestedFields.every((field) => allowedFieldsForAssignee.includes(field));
            const hasStatusChange = requestedFields.includes('status');

            if (!isAllowedAccess || !hasStatusChange) {
                return res.status(403).json({ message: "Employees can only update the status of their assigned tasks." });
            }
        }

        const updateData: any = { ...validation.data };

        if (updateData.assignedTo) {
            if (!mongoose.Types.ObjectId.isValid(updateData.assignedTo)) {
                return res.status(400).json({ message: "Invalid assignedTo User ID format" });
            }
            updateData.assignedTo = new mongoose.Types.ObjectId(updateData.assignedTo);
        }

        if (updateData.storyId) {
            if (!mongoose.Types.ObjectId.isValid(updateData.storyId)) {
                return res.status(400).json({ message: "Invalid Story ID format" });
            }
            const newStory = await UserStory.findById(updateData.storyId);
            if (!newStory) return res.status(404).json({ message: "Target story not found" });

            updateData.storyId = newStory._id;
            updateData.sprintId = newStory.sprintId;

            if (updateData.position === undefined) {
                const taskCountInTargetStory = await Task.countDocuments({ storyId: newStory._id });
                updateData.position = taskCountInTargetStory;
            }
        }

        // Single query with populate (Redundant second populate removed)
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .populate("assignedTo", "name email role")
            .populate("createdBy", "name email role");

        return res.status(200).json({ message: "Task updated successfully", task: updatedTask });

    } catch (error: any) {
        return res.status(500).json({ message: "Server error update tasks: " + error.message });
    }
}

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const taskId = req.params.taskId as string;
        const targetTaskId = new mongoose.Types.ObjectId(taskId);

        const task = await Task.findById(targetTaskId);
        if (!task) return res.status(404).json({ message: "Task not found" });

        const currentUserId = user?.id ?? user?._id;
        const normalizedRole = (user?.role ?? '').toLowerCase();
        const isPrivileged = normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'superadmin';
        const isCreator = Boolean(currentUserId && task.createdBy && task.createdBy.toString() === currentUserId.toString());

        if (!isPrivileged && !isCreator) {
            return res.status(403).json({ message: "You don't have permission to delete this task." });
        }

        // 1. Is task se jude saare child Issues ka link tod do (taskId: null)
        await Issue.updateMany(
            { taskId: targetTaskId },
            { $set: { taskId: null } }
        );

        // 2. Is task ke saare comments delete kar do
        await TaskComment.deleteMany({ taskId: targetTaskId });

        // 3. Main task ko delete karo
        await Task.findByIdAndDelete(targetTaskId);

        return res.status(200).json({ message: "Task and its dependencies cleaned up successfully" });
    } catch (error: any) {
        return res.status(500).json({ message: "Server error while deleting task: " + error.message });
    }
};