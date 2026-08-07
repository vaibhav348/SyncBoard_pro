"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const IssueSchema = new mongoose_1.Schema({
    issueNumber: { type: Number, required: true },
    issueKey: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ['Todo', 'In-Progress', 'Review', 'Done'],
        default: 'Todo',
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
        required: true
    },
    type: {
        type: String,
        enum: ['Bug', 'Feature', 'Issue'],
        required: true
    },
    severity: {
        type: String,
        enum: ['Low', 'Normal', 'High', 'Critical'],
        default: 'Normal',
        required: true
    },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true },
    companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Company', required: true },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    assignedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    taskId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Task', default: null },
    sprintId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Sprint', default: null },
    position: { type: Number, default: 0 },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Issue", IssueSchema);
