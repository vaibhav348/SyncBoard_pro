"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = require("mongoose");
const ProjectSchema = new mongoose_2.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    companyId: {
        type: mongoose_2.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    project_owner: {
        type: mongoose_2.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    members: [
        {
            type: mongoose_2.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});
const Project = mongoose_1.default.model("Project", ProjectSchema);
exports.default = Project;
