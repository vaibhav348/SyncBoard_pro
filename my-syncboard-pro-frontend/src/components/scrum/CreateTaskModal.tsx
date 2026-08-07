import { useState } from 'react';
import type { FormEvent } from 'react';
import { X, Paperclip, User, Flag, CheckCircle2 } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { useAppDispatch, useAppSelector } from '../../hooks/storeHooks';
import { addTask } from '../../features/activeScrum/scrumSlice';
import type { ITask } from '../../types/scrum.types';

// 1. Backend Enums Alignment
type TaskStatus = 'Todo' | 'In-Progress' | 'Review' | 'Done';
type TaskPriority = 'Low' | 'Medium' | 'High';

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];

// Keep these in sync with the backend Zod limits (title 150 / description 2000)
const LIMITS = {
  TITLE_MAX: 150,
  DESC_MAX: 2000,
};

interface Props {
  onClose: () => void;
  storyId: string;
  onTaskCreated?: (task: ITask) => void;
}

const CreateTaskModal = ({ onClose, storyId, onTaskCreated }: Props) => {
  const dispatch = useAppDispatch();

  // Redux state se current project aur members fetch karna
  const activeProject = useAppSelector((s) => s.activeProject.data);
  const projectId = activeProject?._id;
  const projectMembers = Array.isArray(activeProject?.members) ? activeProject.members : []; // Project team members list

  // 2. Form state matched strictly with backend ITask schema
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'Todo' as TaskStatus,
    priority: 'Medium' as TaskPriority,
    assignedTo: '' as string, // ObjectId string or empty
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Form Submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError('Task title is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 3. Payload preparation matching ITask model
      // 3. Payload preparation matching ITask model
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        storyId,
        projectId,
        ...(form.assignedTo ? { assignedTo: form.assignedTo } : {}),
      };

      
      const res = await axiosInstance.post('/task/create', payload);
      const createdTask = (res.data?.task ?? res.data) as ITask | undefined;

      if (!createdTask) {
        throw new Error('The server did not return a created task.');
      }

      dispatch(addTask(createdTask));
      onTaskCreated?.(createdTask);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header Section */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-800">Create Task</h2>
            <span className="text-xs text-zinc-400 font-mono">
              (Story ID: #{storyId ? storyId.slice(-4) : ''})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

          {/* LEFT COLUMN: Main Inputs */}
          <form id="task-form" onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs px-3 py-2.5 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Task Title */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                maxLength={LIMITS.TITLE_MAX}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Implement JWT authentication API"
                className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                autoFocus
              />
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Description <span className="text-zinc-400">(Optional)</span>
              </label>
              <textarea
                value={form.description}
                maxLength={LIMITS.DESC_MAX}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Add acceptance criteria or technical details..."
                rows={5}
                className="w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-y"
              />
            </div>

            {/* Attachments Placeholder */}
            <div>
              <button
                type="button"
                className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 px-3 py-2 rounded-lg border border-dashed border-zinc-300 w-full justify-center transition-colors"
              >
                <Paperclip size={14} />
                <span>Attach files or screenshots</span>
              </button>
            </div>
          </form>

          {/* RIGHT COLUMN: Sidebar Metadata Controls */}
          <div className="w-full md:w-64 bg-zinc-50/50 border-l border-zinc-100 p-6 flex flex-col gap-5 shrink-0">

            {/* Assignee Selector (Mapped to User ObjectId) */}
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                <User size={12} /> Assignee
              </label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 focus:outline-none focus:border-blue-500 transition-all"
              >
                <option value="">Unassigned</option>
                {projectMembers.map((member: any) => (
                  <option key={member._id || member.id} value={member._id || member.id}>
                    {member.name || member.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Selector (Mapped to Enum) */}
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                <Flag size={12} /> Priority
              </label>
              <div className="flex flex-col gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, priority: p }))}
                    className={`flex items-center justify-between text-xs font-medium px-3 py-2 rounded-lg border text-left transition-all ${form.priority === p
                        ? 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                  >
                    <span>{p}</span>
                    {form.priority === p && <CheckCircle2 size={12} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="px-6 py-3.5 border-t border-zinc-100 bg-white flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            form="task-form"
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateTaskModal;