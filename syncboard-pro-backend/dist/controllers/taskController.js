"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getTasksById = exports.getTasksBySprint = exports.getTasksByStory = exports.createTask = void 0;
const zod_1 = __importDefault(require("zod"));
const UserStory_1 = __importDefault(require("../models/UserStory"));
const Task_1 = __importDefault(require("../models/Task"));
const mongoose_1 = __importDefault(require("mongoose"));
const Issue_1 = __importDefault(require("../models/Issue"));
const TaskComment_1 = __importDefault(require("../models/TaskComment"));
const CreateTaskSchema = zod_1.default.object({
    storyId: zod_1.default.string().min(1, "Story ID is required"),
    title: zod_1.default.string().min(2, "Title should be at least 2 characters long"),
    description: zod_1.default.string().optional(),
    priority: zod_1.default.enum(["Low", "Medium", "High"]).optional().default("Medium"),
    assignedTo: zod_1.default.string().optional()
});
const UpdateTaskSchema = zod_1.default.object({
    title: zod_1.default.string().optional(),
    description: zod_1.default.string().optional(),
    status: zod_1.default.enum(["Todo", "In-Progress", "Review", "Done"]).optional(),
    priority: zod_1.default.enum(["Low", "Medium", "High"]).optional(), // TaskSchema me Critical nahi h
    assignedTo: zod_1.default.string().nullable().optional(),
    position: zod_1.default.number().optional(),
    storyId: zod_1.default.string().optional(),
});
const createTask = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "unauthorized" });
        }
        const validation = CreateTaskSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }
        const { storyId, title, description, priority, assignedTo } = validation.data;
        // 1. Parent story dhoondo
        const story = await UserStory_1.default.findById(storyId);
        if (!story) {
            return res.status(404).json({ message: "Parent user story is not found" });
        }
        const taskCount = await Task_1.default.countDocuments({ storyId });
        // 2. Schema ki requirements nikaalo parent story aur logged-in user se
        const projectId = story.projectId;
        const companyId = user.companyId; // Make sure tumhara authMiddleware token se companyId req.user mein set karta ho
        // 3. Ab saare fields ke saath Task banao
        const newTask = await Task_1.default.create({
            storyId: new mongoose_1.default.Types.ObjectId(storyId),
            projectId: projectId, // Add kiya (Required check pass)
            companyId: companyId, // Add kiya (Required check pass)
            sprintId: story.sprintId, // Auto-copy from story
            title,
            description,
            priority: priority,
            assignedTo: assignedTo ? new mongoose_1.default.Types.ObjectId(assignedTo) : undefined,
            createdBy: user.id ? new mongoose_1.default.Types.ObjectId(user.id) : undefined,
            position: taskCount,
            status: "Todo"
        });
        await newTask.populate("createdBy", "name email role");
        await newTask.populate("assignedTo", "name email role");
        return res.status(201).json({ message: "Task create successfully", task: newTask });
    }
    catch (error) {
        console.log("error while create task", error);
        return res.status(500).json({ message: "Server error while creating task: " + error.message });
    }
};
exports.createTask = createTask;
const getTasksByStory = async (req, res) => {
    try {
        const storyId = req.params.storyId;
        if (!storyId)
            return res.status(400).json({ message: "Story ID is required" });
        const tasks = await Task_1.default.find({ storyId: new mongoose_1.default.Types.ObjectId(storyId) })
            .populate("assignedTo", "name email role")
            .populate("createdBy", "name email role")
            .sort({ position: 1 });
        return res.status(200).json(tasks);
    }
    catch (error) {
        return res.status(500).json({ message: "Server error fetching tasks by story: " + error.message });
    }
};
exports.getTasksByStory = getTasksByStory;
// 3. GET TASKS BY SPRINT (Active Kanban Board View)
const getTasksBySprint = async (req, res) => {
    try {
        const sprintId = req.params.sprintId;
        if (!sprintId)
            return res.status(400).json({ message: "Sprint ID is required" });
        const tasks = await Task_1.default.find({ sprintId: new mongoose_1.default.Types.ObjectId(sprintId) })
            .populate("assignedTo", "name email role")
            .populate("createdBy", "name email role")
            .populate("storyId", "title storyPoints") // Card par User story ka title dikhane ke liye
            .sort({ position: 1 });
        return res.status(200).json(tasks);
    }
    catch (error) {
        return res.status(500).json({ message: "Server error fetching active board tasks: " + error.message });
    }
};
exports.getTasksBySprint = getTasksBySprint;
const getTasksById = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        if (!taskId)
            return res.status(400).json({ message: "Task ID is required" });
        // const tasks = await Task.find({ sprintId: new mongoose.Types.ObjectId(sprintId) })
        const task = await Task_1.default.findById(taskId)
            .populate("assignedTo", "name email role")
            .populate("createdBy", "name email role")
            .populate("storyId", "title storyPoints");
        return res.status(200).json(task);
    }
    catch (error) {
        return res.status(500).json({ message: "Server error fetching task: " + error.message });
    }
};
exports.getTasksById = getTasksById;
const updateTask = async (req, res) => {
    try {
        const user = req.user;
        const taskId = req.params.taskId;
        if (!mongoose_1.default.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: "Invalid Task ID format" });
        }
        const validation = UpdateTaskSchema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).json({ errors: validation.error.issues });
        const task = await Task_1.default.findById(taskId);
        if (!task)
            return res.status(404).json({ message: "Task not found" });
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
        const updateData = { ...validation.data };
        if (updateData.assignedTo) {
            if (!mongoose_1.default.Types.ObjectId.isValid(updateData.assignedTo)) {
                return res.status(400).json({ message: "Invalid assignedTo User ID format" });
            }
            updateData.assignedTo = new mongoose_1.default.Types.ObjectId(updateData.assignedTo);
        }
        if (updateData.storyId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(updateData.storyId)) {
                return res.status(400).json({ message: "Invalid Story ID format" });
            }
            const newStory = await UserStory_1.default.findById(updateData.storyId);
            if (!newStory)
                return res.status(404).json({ message: "Target story not found" });
            updateData.storyId = newStory._id;
            updateData.sprintId = newStory.sprintId;
            if (updateData.position === undefined) {
                const taskCountInTargetStory = await Task_1.default.countDocuments({ storyId: newStory._id });
                updateData.position = taskCountInTargetStory;
            }
        }
        // Single query with populate (Redundant second populate removed)
        const updatedTask = await Task_1.default.findByIdAndUpdate(taskId, { $set: updateData }, { new: true, runValidators: true })
            .populate("assignedTo", "name email role")
            .populate("createdBy", "name email role");
        return res.status(200).json({ message: "Task updated successfully", task: updatedTask });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error update tasks: " + error.message });
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    try {
        const user = req.user;
        const taskId = req.params.taskId;
        const targetTaskId = new mongoose_1.default.Types.ObjectId(taskId);
        const task = await Task_1.default.findById(targetTaskId);
        if (!task)
            return res.status(404).json({ message: "Task not found" });
        const currentUserId = user?.id ?? user?._id;
        const normalizedRole = (user?.role ?? '').toLowerCase();
        const isPrivileged = normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'superadmin';
        const isCreator = Boolean(currentUserId && task.createdBy && task.createdBy.toString() === currentUserId.toString());
        if (!isPrivileged && !isCreator) {
            return res.status(403).json({ message: "You don't have permission to delete this task." });
        }
        // 1. Is task se jude saare child Issues ka link tod do (taskId: null)
        await Issue_1.default.updateMany({ taskId: targetTaskId }, { $set: { taskId: null } });
        // 2. Is task ke saare comments delete kar do
        await TaskComment_1.default.deleteMany({ taskId: targetTaskId });
        // 3. Main task ko delete karo
        await Task_1.default.findByIdAndDelete(targetTaskId);
        return res.status(200).json({ message: "Task and its dependencies cleaned up successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error while deleting task: " + error.message });
    }
};
exports.deleteTask = deleteTask;
