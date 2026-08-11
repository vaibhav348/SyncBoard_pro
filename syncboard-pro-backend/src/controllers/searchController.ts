import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Task from "../models/Task";
import Sprint from "../models/Sprint";
import Issue from "../models/Issue";
import Project from "../models/Project";
import User from "../models/User";
import UserStory from "../models/UserStory";
import { escapeRegex } from "../utils/Escaperegex";

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 20;
const MIN_QUERY_LENGTH = 2;

const VALID_TYPES = ["all", "tasks", "stories", "sprints", "issues", "members"] as const;
type SearchType = (typeof VALID_TYPES)[number];

interface ProjectFilter {
  projectId: mongoose.Types.ObjectId;
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId;

    if (!projectIdString || !mongoose.Types.ObjectId.isValid(projectIdString)) {
      res.status(400).json({ message: "Invalid project id" });
      return;
    }

    const rawQuery = ((req.query.q as string) || "").trim();
    const type: SearchType = VALID_TYPES.includes(req.query.type as SearchType)
      ? (req.query.type as SearchType)
      : "all";
    const limit = Math.min(parseInt(req.query.limit as string, 10) || DEFAULT_LIMIT, MAX_LIMIT);

    if (rawQuery.length < MIN_QUERY_LENGTH) {
      res.json({ tasks: [], stories: [], sprints: [], issues: [], members: [] });
      return;
    }

    const pattern = new RegExp(escapeRegex(rawQuery), "i");
    // ✅ FIX: field name is `projectId` in Task/Sprint/Issue/UserStory models, not `project`
    const projectFilter: ProjectFilter = { projectId: new mongoose.Types.ObjectId(projectIdString) };

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
  } catch (err) {
    next(err);
  }
}

function searchTasks(projectFilter: ProjectFilter, pattern: RegExp, limit: number) {
  return Task.find({
    ...projectFilter,
    $or: [{ title: pattern }, { description: pattern }],
  })
    // ✅ FIX: Task model has no `taskKey` field, and assignee field is `assignedTo`
    .select("title status priority assignedTo updatedAt")
    .populate("assignedTo", "name avatarUrl")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
}

function searchStories(projectFilter: ProjectFilter, pattern: RegExp, limit: number) {
  return UserStory.find({
    ...projectFilter,
    $or: [{ title: pattern }, { description: pattern }],
  })
    // ✅ FIX: UserStory model field is `storyPoints`, not `points`
    .select("title storyPoints updatedAt")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
}

function searchSprints(projectFilter: ProjectFilter, pattern: RegExp, limit: number) {
  return Sprint.find({
    ...projectFilter,
    $or: [{ name: pattern }, { goal: pattern }],
  })
    .select("name goal status startDate endDate")
    .sort({ startDate: -1 })
    .limit(limit)
    .lean();
}

function searchIssues(projectFilter: ProjectFilter, pattern: RegExp, limit: number) {
  return Issue.find({
    ...projectFilter,
    $or: [{ title: pattern }, { description: pattern }, { issueKey: pattern }],
  })
    // ✅ FIX: Issue model has no `reportedBy` field — using `createdBy` instead
    // (swap to `assignedBy` if that's what should show as "reporter")
    .select("title status priority type issueKey updatedAt")
    .populate("createdBy", "name avatarUrl")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
}

async function searchMembers(projectId: string, pattern: RegExp, limit: number) {
  const project = await Project.findById(projectId).select("members").lean();
  if (!project || !project.members?.length) return [];

  return User.find({
    _id: { $in: project.members },
    $or: [{ name: pattern }, { email: pattern }],
  })
    .select("name email avatarUrl role")
    .limit(limit)
    .lean();
}