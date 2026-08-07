"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoryComments = exports.createStoryComment = void 0;
const zod_1 = __importDefault(require("zod"));
const UserStory_1 = __importDefault(require("../models/UserStory"));
const StoryComment_1 = __importDefault(require("../models/StoryComment"));
const mongoose_1 = __importDefault(require("mongoose"));
const CreateCommentSchema = zod_1.default.object({
    storyId: zod_1.default.string().min(1, "Story ID is required"),
    text: zod_1.default.string().min(1, "Comment text cannot be empty"),
});
const createStoryComment = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const validation = CreateCommentSchema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).json({ errors: validation.error.issues });
        const { storyId, text } = validation.data;
        const story = await UserStory_1.default.findById(storyId);
        if (!story)
            return res.status(404).json({ message: "Story not found" });
        const newComment = await StoryComment_1.default.create({
            storyId: new mongoose_1.default.Types.ObjectId(storyId),
            userId: new mongoose_1.default.Types.ObjectId(user.id),
            content: text,
        });
        const populatedComment = await newComment.populate("userId", "name email role");
        return res.status(201).json({ message: "Comment added successfully", comment: populatedComment });
    }
    catch (error) {
        return res.status(500).json({ message: "Error creating story comment: " + error.message });
    }
};
exports.createStoryComment = createStoryComment;
const getStoryComments = async (req, res) => {
    try {
        const storyId = req.params.storyId;
        if (!storyId)
            return res.status(400).json({ message: "Story ID parameter is required" });
        const comments = await StoryComment_1.default.find({ storyId: new mongoose_1.default.Types.ObjectId(storyId) })
            .populate("userId", "name email role")
            .sort({ createdAt: 1 });
        return res.status(200).json(comments);
    }
    catch (error) {
        return res.status(500).json({ message: "Error fetching story comments: " + error.message });
    }
};
exports.getStoryComments = getStoryComments;
