"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStory = exports.moveStoryToSprint = exports.updateStory = exports.getStoryById = exports.getStoriesBySprint = exports.getBacklogStories = exports.createStory = void 0;
const zod_1 = __importDefault(require("zod"));
const Sprint_1 = __importDefault(require("../models/Sprint"));
const UserStory_1 = __importDefault(require("../models/UserStory"));
const Task_1 = __importDefault(require("../models/Task"));
const Issue_1 = __importDefault(require("../models/Issue"));
const StoryComment_1 = __importDefault(require("../models/StoryComment"));
const mongoose_1 = __importDefault(require("mongoose"));
const CreateStorySchema = zod_1.default.object({
    projectId: zod_1.default.string().min(1, "Project ID is required"),
    title: zod_1.default.string().min(2, "Title should be at least 2 characters long"),
    description: zod_1.default.string().optional(),
    storyPoints: zod_1.default.number().nonnegative().optional().default(0),
    sprintId: zod_1.default.string().nullable().optional(),
    assignee: zod_1.default.string().nullable().optional()
});
const MoveStorySchema = zod_1.default.object({
    sprintId: zod_1.default.string().nullable() // Target sprint id ya backlog ke liye null
});
const UpdateStorySchema = zod_1.default.object({
    title: zod_1.default.string().min(2, "Title should be at least 2 characters long").optional(),
    description: zod_1.default.string().optional(),
    storyPoints: zod_1.default.number().nonnegative().optional(),
    assignee: zod_1.default.string().nullable().optional(),
});
const createStory = async (req, res) => {
    try {
        const user = req.user;
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
            const sprintExists = await Sprint_1.default.findById(sprintId);
            if (!sprintExists) {
                return res.status(404).json({ message: "Assigned sprint not found" });
            }
        }
        const newStory = await UserStory_1.default.create({
            projectId,
            title,
            description,
            storyPoints,
            sprintId: sprintId || null,
            assignee: assignee || null,
            createdBy: user.id ? new mongoose_1.default.Types.ObjectId(user.id) : undefined
        });
        await newStory.populate('assignee', 'name email avatar');
        return res.status(200).json({ message: "userStory created successfully", story: newStory });
    }
    catch (error) {
        console.error("Error in startSprint:", error);
        return res.status(500).json({ message: "Server error while creating story of sprint: " + error });
    }
};
exports.createStory = createStory;
const getBacklogStories = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!projectId)
            return res.status(400).json({ message: "Project ID is required" });
        const stories = await UserStory_1.default.find({ projectId, sprintId: null })
            .populate('assignee', 'name email avatar') // 👈 Assignee ki basic details frontend ko bhejne ke liye
            .sort({ position: 1 });
        return res.status(200).json(stories);
    }
    catch (error) {
        return res.status(500).json({ message: "Server error while fetching backlog: " + error.message });
    }
};
exports.getBacklogStories = getBacklogStories;
const getStoriesBySprint = async (req, res) => {
    try {
        const { sprintId } = req.params;
        if (!sprintId)
            return res.status(400).json({ message: "Sprint ID is required" });
        const sprint = await Sprint_1.default.findById(sprintId);
        if (!sprint)
            return res.status(404).json({ message: "Sprint not found" });
        const stories = await UserStory_1.default.find({ sprintId })
            .populate('assignee', 'name email avatar') // 👈 Assignee Details Populated
            .sort({ position: 1 });
        const storiesWithMetrics = await Promise.all(stories.map(async (story) => {
            const totalTasks = await Task_1.default.countDocuments({ storyId: story._id });
            const doneTasks = await Task_1.default.countDocuments({ storyId: story._id, status: "Done" });
            return {
                ...story.toObject(),
                totalTasks,
                doneTasks
            };
        }));
        return res.status(200).json(storiesWithMetrics);
    }
    catch (error) {
        return res.status(500).json({ message: "Server error while fetching sprint stories: " + error.message });
    }
};
exports.getStoriesBySprint = getStoriesBySprint;
const getStoryById = async (req, res) => {
    try {
        const storyId = req.params.storyId;
        if (!storyId)
            return res.status(400).json({ message: "Story ID is required" });
        const story = await UserStory_1.default.findById(storyId)
            .populate("assignee", "name email avatar")
            .populate("sprintId", "name");
        if (!story)
            return res.status(404).json({ message: "User Story not found" });
        return res.status(200).json({ story });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error while fetching story: " + error.message });
    }
};
exports.getStoryById = getStoryById;
const updateStory = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const normalizedRole = (user.role ?? '').toLowerCase();
        const isPrivileged = normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'superadmin';
        if (!isPrivileged) {
            return res.status(403).json({ message: "Employees do not have permission to update user stories" });
        }
        const storyId = req.params.storyId;
        const validation = UpdateStorySchema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).json({ errors: validation.error.issues });
        const story = await UserStory_1.default.findById(storyId);
        if (!story)
            return res.status(404).json({ message: "User Story not found" });
        const { title, description, storyPoints, assignee } = validation.data;
        if (title !== undefined)
            story.title = title;
        if (description !== undefined)
            story.description = description;
        if (storyPoints !== undefined)
            story.storyPoints = storyPoints;
        if (assignee !== undefined) {
            story.assignee = assignee ? new mongoose_1.default.Types.ObjectId(assignee) : null;
        }
        await story.save();
        const populatedStory = await UserStory_1.default.findById(storyId)
            .populate("assignee", "name email avatar")
            .populate("sprintId", "name");
        return res.status(200).json({ message: "Story updated successfully", story: populatedStory });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error while updating story: " + error.message });
    }
};
exports.updateStory = updateStory;
// 4. MOVE STORY TO SPRINT / BACKLOG (Fixed TypeScript Types & Array Clash)
const moveStoryToSprint = async (req, res) => {
    try {
        const user = req.user;
        if (user?.role === "employee")
            return res.status(403).json({ message: "Forbidden" });
        // FIX: TypeScript ko explicitly bataya ki ye sirf string hai, array nahi
        const storyId = req.params.storyId;
        const validation = MoveStorySchema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).json({ errors: validation.error.issues });
        const { sprintId } = validation.data; // Ye 'string | null' hai
        // String ko proper Mongoose ObjectId mein convert karo (agar null nahi hai toh)
        const targetSprintId = sprintId ? new mongoose_1.default.Types.ObjectId(sprintId) : null;
        // Ab yahan array wala error nahi aayega kyunki storyId ko string ghoshit kar diya hai
        const targetStoryId = new mongoose_1.default.Types.ObjectId(storyId);
        const story = await UserStory_1.default.findById(targetStoryId);
        if (!story)
            return res.status(404).json({ message: "User Story not found" });
        if (targetSprintId) {
            const sprint = await Sprint_1.default.findById(targetSprintId);
            if (!sprint)
                return res.status(404).json({ message: "Target Sprint not found" });
        }
        // Story target update karo
        story.sprintId = targetSprintId;
        await story.save();
        // Child tasks ko bhi update karo
        const updatedTasks = await Task_1.default.updateMany({ storyId: targetStoryId }, { $set: { sprintId: targetSprintId } });
        return res.status(200).json({
            message: "Story moved successfully and child tasks synchronized.",
            story,
            tasksSynced: updatedTasks.modifiedCount
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error during migration: " + error.message });
    }
};
exports.moveStoryToSprint = moveStoryToSprint;
const deleteStory = async (req, res) => {
    try {
        const user = req.user;
        const { storyId } = req.params;
        const story = await UserStory_1.default.findById(storyId);
        if (!story)
            return res.status(404).json({ message: "User Story not found" });
        const currentUserId = user?.id ?? user?._id;
        const normalizedRole = (user?.role ?? '').toLowerCase();
        const isPrivileged = normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'superadmin';
        const isCreator = Boolean(currentUserId && story.createdBy && story.createdBy.toString() === currentUserId.toString());
        if (!isPrivileged && !isCreator) {
            return res.status(403).json({ message: "You don't have permission to delete this story." });
        }
        // Find all target child tasks
        const tasks = await Task_1.default.find({ storyId });
        const taskIds = tasks.map(t => t._id);
        // 1. In child tasks ke andar jitne bhi Issues/Bugs nikaale the, unka taskId null karo
        await Issue_1.default.updateMany({ taskId: { $in: taskIds } }, { $set: { taskId: null } });
        // 2. Tasks ko mass-delete karo
        await Task_1.default.deleteMany({ storyId });
        // 3. Story comments delete karo
        await StoryComment_1.default.deleteMany({ storyId });
        // 4. Last mein core Story udaao
        await UserStory_1.default.findByIdAndDelete(storyId);
        return res.status(200).json({ message: "User Story and dependent cascade elements cleaned successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error on cascading deletion: " + error.message });
    }
};
exports.deleteStory = deleteStory;
