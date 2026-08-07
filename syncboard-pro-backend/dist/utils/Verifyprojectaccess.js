"use strict";
// middleware/verifyProjectAccess.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyProjectAccess = verifyProjectAccess;
const mongoose_1 = __importDefault(require("mongoose"));
const Project_1 = __importDefault(require("../models/Project"));
async function verifyProjectAccess(req, res, next) {
    try {
        const { projectId } = req.params;
        const projectIdString = Array.isArray(projectId) ? projectId[0] : projectId;
        if (!mongoose_1.default.Types.ObjectId.isValid(projectIdString)) {
            res.status(400).json({ message: "Invalid project id" });
            return;
        }
        const project = await Project_1.default.findOne({
            _id: projectIdString,
            members: req.user?._id,
        }).select("_id");
        if (!project) {
            res.status(403).json({ message: "You don't have access to this project" });
            return;
        }
        next();
    }
    catch (err) {
        next(err);
    }
}
