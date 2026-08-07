"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = require("mongoose");
const SprintSchema = new mongoose_2.Schema({
    projectId: {
        type: mongoose_2.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    goal: {
        type: String,
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ["planned", "active", "completed"],
        default: "planned"
    },
    createdBy: {
        type: mongoose_2.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });
const Sprint = mongoose_1.default.model("Sprint", SprintSchema);
exports.default = Sprint;
