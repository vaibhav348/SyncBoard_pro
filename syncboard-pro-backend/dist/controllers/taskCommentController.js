"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTaskComment = exports.updateTaskComment = exports.getTaskComments = exports.createTaskComment = void 0;
const zod_1 = __importDefault(require("zod"));
const Task_1 = __importDefault(require("../models/Task"));
const TaskComment_1 = __importDefault(require("../models/TaskComment"));
const mongoose_1 = __importDefault(require("mongoose"));
const CreateCommentSchema = zod_1.default.object({
    taskId: zod_1.default.string().min(1, "Task ID is required"),
    text: zod_1.default.string().min(1, "Comment text cannot be empty")
});
const UpdateCommentSchema = zod_1.default.object({
    text: zod_1.default.string().min(1, "Comment text cannot be empty")
});
const createTaskComment = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const validation = CreateCommentSchema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).json({ errors: validation.error.issues });
        const { taskId, text } = validation.data;
        const task = await Task_1.default.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        const newComment = await TaskComment_1.default.create({
            taskId: new mongoose_1.default.Types.ObjectId(taskId),
            userId: new mongoose_1.default.Types.ObjectId(user.id),
            content: text
        });
        const populatedComment = await newComment.populate("userId", "name email role");
        return res.status(201).json({ message: "Comment added successfully", comment: populatedComment });
    }
    catch (error) {
        console.log("error while create task comment", error);
        return res.status(400).json({ message: "error while create task comment", error });
    }
};
exports.createTaskComment = createTaskComment;
const getTaskComments = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        if (!taskId)
            return res.status(400).json({ message: "Task ID parameter is required" });
        // Oldest comments first taaki chat sequence sahi rahe (createdAt: 1)
        const comments = await TaskComment_1.default.find({ taskId: new mongoose_1.default.Types.ObjectId(taskId) })
            .populate("userId", "name email role")
            .sort({ createdAt: 1 });
        return res.status(200).json(comments);
    }
    catch (error) {
        return res.status(500).json({ message: "Error fetching comments: " + error.message });
    }
};
exports.getTaskComments = getTaskComments;
const updateTaskComment = async (req, res) => {
    try {
        const user = req.user;
        const commentId = req.params.commentId;
        const validation = UpdateCommentSchema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).json({ errors: validation.error.issues });
        const comment = await TaskComment_1.default.findById(commentId);
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });
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
    }
    catch (error) {
        return res.status(500).json({ message: "Error updating comment: " + error.message });
    }
};
exports.updateTaskComment = updateTaskComment;
const deleteTaskComment = async (req, res) => {
    try {
        const user = req.user;
        const commentId = req.params.commentId;
        const comment = await TaskComment_1.default.findById(commentId);
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });
        const currentUserId = user?.id ?? user?._id;
        const isAuthor = Boolean(currentUserId && comment.userId.toString() === currentUserId.toString());
        const isPrivileged = user.role === "owner" || user.role === "manager" || user.role === "superadmin";
        if (!isAuthor && !isPrivileged) {
            return res.status(403).json({ message: "You don't have permission to delete this comment." });
        }
        await TaskComment_1.default.findByIdAndDelete(commentId);
        return res.status(200).json({ message: "Comment deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Error deleting comment: " + error.message });
    }
};
exports.deleteTaskComment = deleteTaskComment;
