import mongoose, { Schema, Document } from "mongoose";

export interface IIssue extends Document {
  issueNumber: number;
  issueKey: string;
  title: string;
  description: string;
  status: 'Todo' | 'In-Progress' | 'Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  type: 'Bug' | 'Feature' | 'Issue';
  severity: 'Low' | 'Normal' | 'High' | 'Critical';
  projectId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;     // ✅ parent Task ka reference
  sprintId?: mongoose.Types.ObjectId | null; // denormalized — fast queries
  position: number;
  // storyId HATA DIYA — taskId → task.storyId se milta hai
}

const IssueSchema = new Schema<IIssue>({
  issueNumber: { type: Number, required: true },
  issueKey:    { type: String, required: true },
  title:       { type: String, required: true },
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
  projectId:  { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  companyId:  { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  taskId:   { type: Schema.Types.ObjectId, ref: 'Task', default: null },
  sprintId: { type: Schema.Types.ObjectId, ref: 'Sprint', default: null },
  position: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IIssue>("Issue", IssueSchema);