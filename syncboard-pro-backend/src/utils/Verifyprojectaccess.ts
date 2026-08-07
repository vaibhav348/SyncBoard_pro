// middleware/verifyProjectAccess.ts

/// <reference path="../global.d.ts" />

import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Project from "../models/Project";

export async function verifyProjectAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId;

    if (!mongoose.Types.ObjectId.isValid(projectIdString)) {
      res.status(400).json({ message: "Invalid project id" });
      return;
    }

    const project = await Project.findOne({
      _id: projectIdString,
      members: req.user?._id,
    }).select("_id");

    if (!project) {
      res.status(403).json({ message: "You don't have access to this project" });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}