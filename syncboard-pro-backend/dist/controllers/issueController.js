"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIssuesBySprint = exports.getIssuesByTask = exports.getIssueComments = exports.deleteIssue = exports.deleteIssueComment = exports.updateIssueComment = exports.addCommentToIssue = exports.getIssueById = exports.updateIssue = exports.getProjectIssues = exports.createIssue = void 0;
const zod_1 = require("zod");
const Project_1 = __importDefault(require("../models/Project"));
const Counter_1 = __importDefault(require("../models/Counter"));
const mongoose_1 = __importDefault(require("mongoose"));
const Comment_1 = __importDefault(require("../models/Comment"));
const Issue_1 = __importDefault(require("../models/Issue"));
const IssueSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, "Title should be at least 2 characters long"),
    description: zod_1.z.string().min(10, "Description should be at least 10 characters long"),
    priority: zod_1.z.enum(['Low', 'Medium', 'High']).default('Medium'),
    type: zod_1.z.enum(['Bug', 'Feature', 'Issue'], { message: "Type is mandatory" }),
    severity: zod_1.z.enum(['Low', 'Normal', 'High', 'Critical']).default('Normal'),
    projectId: zod_1.z.string().min(1, "ProjectId is mandatory"),
    assignedTo: zod_1.z.string().optional(),
    taskId: zod_1.z.string().optional(), // <-- Add kiya
    sprintId: zod_1.z.string().optional()
});
const createIssue = async (req, res) => {
    try {
        // 1. Validate incoming data
        const validation = IssueSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.issues });
        }
        // 2. Auth check
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: user not found on request." });
        }
        const { title, description, priority, type, severity, projectId, assignedTo, taskId, sprintId } = validation.data;
        const assignedBy = user.id;
        const companyId = user?.companyId;
        // 3. Project ownership check
        const project = await Project_1.default.findOne({ _id: projectId, companyId });
        if (!project) {
            return res.status(404).json({
                message: "You do not have permission to create a issue in this project!"
            });
        }
        // 4. 🚀 ATOMIC SEQUENCE GENERATION
        // findOneAndUpdate ke andar $inc automatically counter ko 1 se badha dega
        // upsert: true ka matlab hai ki agar project ka first issue hai toh naya document ban jayega
        const counter = await Counter_1.default.findOneAndUpdate({ projectId: projectId }, { $inc: { seq: 1 } }, { new: true, upsert: true });
        const issueNumber = counter.seq;
        // Padding logic (e.g., 1 -> "001", 12 -> "012")
        const issueKey = String(issueNumber).padStart(3, '0');
        // 5. Create issue with generated ID
        const issue = await Issue_1.default.create({
            issueNumber,
            issueKey,
            title,
            description,
            status: 'Todo',
            priority,
            type,
            severity,
            projectId,
            companyId,
            assignedTo: assignedTo || undefined,
            assignedBy,
            createdBy: user.id ? new mongoose_1.default.Types.ObjectId(user.id) : undefined,
            taskId: taskId ? new mongoose_1.default.Types.ObjectId(taskId) : undefined,
            sprintId: sprintId ? new mongoose_1.default.Types.ObjectId(sprintId) : undefined
        });
        if (issue.assignedTo) {
            await issue.populate("assignedTo", "name email");
        }
        return res.status(201).json({
            message: "Issue created successfully",
            issue: issue
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error while issue creation: " + error.message });
    }
};
exports.createIssue = createIssue;
const getProjectIssues = async (req, res) => {
    try {
        const { projectId } = req.params;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: user not found on request." });
        }
        const companyId = user?.companyId;
        const project = await Project_1.default.findOne({ _id: projectId, companyId });
        if (!project) {
            return res.status(404).json({
                message: " you have not permission to get issues!"
            });
        }
        const issues = await Issue_1.default.find({ projectId: projectId }).populate("assignedTo", "name email");
        return res.status(201).json({
            message: "Issue fatched successfully",
            issues: issues
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error while fatching issues: " + error });
    }
};
exports.getProjectIssues = getProjectIssues;
// 1. Schema for Assigned User (Only allowed to change status)
const UpdateIssueStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['Todo', 'In-Progress', 'Review', 'Done'])
});
// 2. Schema for Creator/Admin (Allowed to change everything)
// ✅ ab — type aur severity add, manager bhi full update kar sakta hai
const FullUpdateIssueSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, "Title should be at least 2 characters long").optional(),
    description: zod_1.z.string().min(10, "Description should be at least 10 characters long").optional(),
    status: zod_1.z.enum(['Todo', 'In-Progress', 'Review', 'Done']).optional(),
    priority: zod_1.z.enum(['Low', 'Medium', 'High']).optional(),
    type: zod_1.z.enum(['Bug', 'Feature', 'Issue']).optional(), // 👈 add
    severity: zod_1.z.enum(['Low', 'Normal', 'High', 'Critical']).optional(), // 👈 add
    assignedTo: zod_1.z.string().optional()
});
const updateIssue = async (req, res) => {
    try {
        const { issueId } = req.params;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User not found on request." });
        }
        const userId = user.id;
        const companyId = user.companyId;
        const issue = await Issue_1.default.findOne({ _id: issueId, companyId });
        if (!issue) {
            return res.status(404).json({ message: "Issue not found." });
        }
        const project = await Project_1.default.findById(issue.projectId);
        const normalizedRole = (user.role ?? '').toLowerCase();
        const isPrivileged = normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'superadmin';
        const isCreator = Boolean(issue.createdBy?.toString() === userId ||
            issue.assignedBy?.toString() === userId);
        const isProjectOwner = project?.project_owner?.toString() === userId;
        const isAssignedUser = issue.assignedTo?.toString() === userId;
        let updateData = {};
        // ✅ CASE A: Full update — creator, project owner, company owner, manager
        if (isCreator || isProjectOwner || isPrivileged) {
            const validation = FullUpdateIssueSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ errors: validation.error.issues });
            }
            updateData = validation.data;
            // ✅ CASE B: Status only — sirf assigned employee
        }
        else if (isAssignedUser) {
            // ✅ Pehle check karo — extra fields hain kya
            // Schema se pehle — taaki clear 403 mile, confusing validation error nahi
            const bodyKeys = Object.keys(req.body);
            const extraKeys = bodyKeys.filter((key) => key !== 'status');
            if (extraKeys.length > 0) {
                return res.status(403).json({
                    message: `As an assigned member, you can only update the issue status. Fields not allowed: ${extraKeys.join(', ')}`
                });
            }
            // Uske baad schema validate karo
            const validation = UpdateIssueStatusSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ errors: validation.error.issues });
            }
            updateData = { status: validation.data.status };
        }
        else {
            return res.status(403).json({
                message: "You do not have permission to update this issue."
            });
        }
        // const issues = await Issue.find({ projectId: projectId }).populate("assignedTo", "name email");
        const updatedIssue = await Issue_1.default.findByIdAndUpdate(issueId, { $set: updateData }, { new: true, runValidators: true }).populate("assignedTo", "name email").populate("assignedBy", 'name email');
        return res.status(200).json({
            message: "Issue updated successfully.",
            issue: updatedIssue
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while updating issue: " + error });
    }
};
exports.updateIssue = updateIssue;
const getIssueById = async (req, res) => {
    try {
        const { issueId } = req.params;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User not found." });
        }
        // 1. Validating Issue ID Format
        if (!mongoose_1.default.Types.ObjectId.isValid(issueId)) {
            return res.status(400).json({ message: "Invalid Issue ID format." });
        }
        // 2. Fetch issue with company scope check
        // Hum sirf wahi issue fetch karenge jo user ki company se belong karta ho
        const issue = await Issue_1.default.findOne({
            _id: issueId,
            companyId: user.companyId
        })
            .populate("assignedTo", "name email")
            .populate("assignedBy", "name email");
        // 3. Not Found Check
        if (!issue) {
            return res.status(404).json({ message: "Issue not found or access denied." });
        }
        // 4. Success Response
        return res.status(200).json({
            message: "Issue fetched successfully",
            issue: issue
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error while fetching issue: " + error });
    }
};
exports.getIssueById = getIssueById;
const addCommentToIssue = async (req, res) => {
    try {
        const { issueId } = req.params;
        const { content } = req.body;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Zod validation agar content ke liye lagana chaho toh laga sakte ho
        if (!content || content.trim() === "") {
            return res.status(400).json({ message: "Comment content cannot be empty" });
        }
        // 🚀 Safe object banao apne Mongoose Model ke sath
        const newComment = new Comment_1.default({
            issueId: issueId, // Explicitly string cast kiya safe rehne ke liye
            userId: user.id,
            content
        });
        await newComment.save();
        // Naye comment ke sath user ki details populate karke UI ko bhejo
        const populatedComment = await Comment_1.default.findById(newComment._id).populate('userId', 'name email profilePic');
        return res.status(201).json({ success: true, comment: populatedComment });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error: " + error.message });
    }
};
exports.addCommentToIssue = addCommentToIssue;
// Fetch all comments of a issue safely inside issue.controller.ts
const UpdateIssueCommentSchema = zod_1.z.object({
    text: zod_1.z.string().min(1, "Comment text cannot be empty")
});
const updateIssueComment = async (req, res) => {
    try {
        const user = req.user;
        const { commentId } = req.params;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const validation = UpdateIssueCommentSchema.safeParse(req.body);
        if (!validation.success)
            return res.status(400).json({ errors: validation.error.issues });
        const comment = await Comment_1.default.findById(commentId);
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });
        const currentUserId = user?.id ?? user?._id;
        const normalizedRole = (user?.role ?? '').toLowerCase();
        const isPrivileged = normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'superadmin';
        const isAuthor = Boolean(currentUserId && comment.userId?.toString() === currentUserId.toString());
        if (!isAuthor && !isPrivileged) {
            return res.status(403).json({ message: "You don't have permission to update this comment." });
        }
        comment.content = validation.data.text;
        await comment.save();
        return res.status(200).json({ message: "Comment updated successfully", comment });
    }
    catch (error) {
        return res.status(500).json({ message: "Error updating comment: " + error.message });
    }
};
exports.updateIssueComment = updateIssueComment;
const deleteIssueComment = async (req, res) => {
    try {
        const user = req.user;
        const { commentId } = req.params;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const comment = await Comment_1.default.findById(commentId);
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });
        const currentUserId = user?.id ?? user?._id;
        const normalizedRole = (user?.role ?? '').toLowerCase();
        const isPrivileged = normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'superadmin';
        const isAuthor = Boolean(currentUserId && comment.userId?.toString() === currentUserId.toString());
        if (!isAuthor && !isPrivileged) {
            return res.status(403).json({ message: "You don't have permission to delete this comment." });
        }
        await Comment_1.default.findByIdAndDelete(commentId);
        return res.status(200).json({ message: "Comment deleted successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Error deleting comment: " + error.message });
    }
};
exports.deleteIssueComment = deleteIssueComment;
const deleteIssue = async (req, res) => {
    try {
        const { issueId } = req.params;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User not found on request." });
        }
        const issue = await Issue_1.default.findById(issueId);
        if (!issue) {
            return res.status(404).json({ message: "Issue not found." });
        }
        const currentUserId = user.id ?? user._id;
        const normalizedRole = (user.role ?? '').toLowerCase();
        const isPrivileged = normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'superadmin';
        const isCreator = Boolean(currentUserId &&
            ((issue.createdBy && issue.createdBy.toString() === currentUserId.toString()) ||
                (issue.assignedBy && issue.assignedBy.toString() === currentUserId.toString())));
        const isAssignedUser = Boolean(currentUserId && issue.assignedTo && issue.assignedTo.toString() === currentUserId.toString());
        if (!isPrivileged && !isCreator && !isAssignedUser) {
            return res.status(403).json({ message: "You don't have permission to delete this issue." });
        }
        await Comment_1.default.deleteMany({ issueId: issue._id });
        await Issue_1.default.findByIdAndDelete(issue._id);
        return res.status(200).json({ message: "Issue deleted successfully." });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error while deleting issue: " + error.message });
    }
};
exports.deleteIssue = deleteIssue;
const getIssueComments = async (req, res) => {
    try {
        const { issueId } = req.params;
        const user = req.user;
        // 1. Auth Check
        if (!user) {
            return res.status(401).json({ message: "Unauthorized: User not found on request." });
        }
        // 2. Validating Issue ID Format (Mongoose Object Id check)
        // Agar URL me galat formats jaise `/issues/123/comments` bhej diya, toh crash hone se bachega
        if (!mongoose_1.default.Types.ObjectId.isValid(issueId)) {
            return res.status(400).json({ message: "Invalid Issue ID format." });
        }
        // 3. 🛡️ Company Scope Security Check
        // Pehle check karo ki ye issue exist karta hai aur usi company ka hai jiska user hai
        const issue = await Issue_1.default.findOne({
            _id: issueId,
            companyId: user.companyId
        });
        if (!issue) {
            return res.status(404).json({ message: "Issue not found or access denied to comments." });
        }
        // 4. Fetch Comments with Sorting & Population
        // `createdAt: 1` ka matlab hai Ascending Order (Sabse purana comment pehle, naya niche—jaise chat me hota hai)
        const comments = await Comment_1.default.find({ issueId: issueId })
            .populate('userId', 'name email profilePic') // Sirf zaroori user details pull karo
            .sort({ createdAt: 1 });
        // 5. Success Response
        return res.status(200).json({
            success: true,
            message: "Comments fetched successfully",
            comments: comments
        });
    }
    catch (error) {
        console.error("Error in getIssueComments:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching comments: " + error.message
        });
    }
};
exports.getIssueComments = getIssueComments;
// GET ISSUES LINKED TO A SPECIFIC TASK
const getIssuesByTask = async (req, res) => {
    try {
        const taskId = req.params.taskId;
        if (!taskId)
            return res.status(400).json({ message: "Task ID is required" });
        const issues = await Issue_1.default.find({ taskId: new mongoose_1.default.Types.ObjectId(taskId) })
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });
        return res.status(200).json(issues);
    }
    catch (error) {
        return res.status(500).json({ message: "Error fetching linked issues: " + error.message });
    }
};
exports.getIssuesByTask = getIssuesByTask;
// GET ISSUES LINKED TO A SPECIFIC TASK
const getIssuesBySprint = async (req, res) => {
    try {
        const sprintId = req.params.sprintId;
        if (!sprintId)
            return res.status(400).json({ message: "Task ID is required" });
        const issues = await Issue_1.default.find({ sprintId: new mongoose_1.default.Types.ObjectId(sprintId) })
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });
        return res.status(200).json(issues);
    }
    catch (error) {
        return res.status(500).json({ message: "Error fetching linked issues: " + error.message });
    }
};
exports.getIssuesBySprint = getIssuesBySprint;
