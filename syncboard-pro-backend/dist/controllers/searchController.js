"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = search;
const mongoose_1 = __importDefault(require("mongoose"));
const Task_1 = __importDefault(require("../models/Task"));
const Sprint_1 = __importDefault(require("../models/Sprint"));
const Issue_1 = __importDefault(require("../models/Issue"));
const Project_1 = __importDefault(require("../models/Project"));
const User_1 = __importDefault(require("../models/User"));
const UserStory_1 = __importDefault(require("../models/UserStory"));
const Escaperegex_1 = require("../utils/Escaperegex");
const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;
const MIN_QUERY_LENGTH = 2;
const VALID_TYPES = ["all", "tasks", "stories", "sprints", "issues", "members"];
async function search(req, res, next) {
    try {
        const { projectId } = req.params;
        const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId;
        if (!projectIdString || !mongoose_1.default.Types.ObjectId.isValid(projectIdString)) {
            res.status(400).json({ message: "Invalid project id" });
            return;
        }
        const rawQuery = (req.query.q || "").trim();
        const type = VALID_TYPES.includes(req.query.type)
            ? req.query.type
            : "all";
        const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT);
        if (rawQuery.length < MIN_QUERY_LENGTH) {
            res.json({ tasks: [], stories: [], sprints: [], issues: [], members: [] });
            return;
        }
        const pattern = new RegExp((0, Escaperegex_1.escapeRegex)(rawQuery), "i");
        const projectFilter = { project: new mongoose_1.default.Types.ObjectId(projectIdString) };
        const wantsAll = type === "all";
        const [tasks, stories, sprints, issues, members] = await Promise.all([
            wantsAll || type === "tasks" ? searchTasks(projectFilter, pattern, limit) : Promise.resolve([]),
            wantsAll || type === "stories" ? searchStories(projectFilter, pattern, limit) : Promise.resolve([]),
            wantsAll || type === "sprints" ? searchSprints(projectFilter, pattern, limit) : Promise.resolve([]),
            wantsAll || type === "issues" ? searchIssues(projectFilter, pattern, limit) : Promise.resolve([]),
            wantsAll || type === "members" ? searchMembers(projectIdString, pattern, limit) : Promise.resolve([]),
        ]);
        res.json({
            query: rawQuery,
            tasks,
            stories,
            sprints,
            issues,
            members,
            total: tasks.length + stories.length + sprints.length + issues.length + members.length,
        });
    }
    catch (err) {
        next(err);
    }
}
function searchTasks(projectFilter, pattern, limit) {
    return Task_1.default.find({
        ...projectFilter,
        $or: [{ title: pattern }, { description: pattern }, { taskKey: pattern }],
    })
        .select("title status priority assignee taskKey updatedAt")
        .populate("assignee", "name avatarUrl")
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();
}
function searchStories(projectFilter, pattern, limit) {
    return UserStory_1.default.find({
        ...projectFilter,
        $or: [{ title: pattern }, { description: pattern }],
    })
        .select("title status points updatedAt")
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();
}
function searchSprints(projectFilter, pattern, limit) {
    return Sprint_1.default.find({
        ...projectFilter,
        $or: [{ name: pattern }, { goal: pattern }],
    })
        .select("name goal status startDate endDate")
        .sort({ startDate: -1 })
        .limit(limit)
        .lean();
}
function searchIssues(projectFilter, pattern, limit) {
    return Issue_1.default.find({
        ...projectFilter,
        $or: [{ title: pattern }, { description: pattern }, { issueKey: pattern }],
    })
        .select("title status priority type issueKey updatedAt")
        .populate("reportedBy", "name avatarUrl")
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();
}
async function searchMembers(projectId, pattern, limit) {
    const project = await Project_1.default.findById(projectId).select("members").lean();
    if (!project || !project.members?.length)
        return [];
    return User_1.default.find({
        _id: { $in: project.members },
        $or: [{ name: pattern }, { email: pattern }],
    })
        .select("name email avatarUrl role")
        .limit(limit)
        .lean();
}
