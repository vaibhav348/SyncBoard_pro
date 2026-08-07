import { useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/storeHooks';
import { createStoryAsync } from '../../features/activeScrum/scrumSlice';

interface Props {
  onClose: () => void;
  sprintId?: string | null;
}

const STORY_POINTS = [1, 2, 3, 5, 8, 13];

const LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 100,
  DESC_MAX: 1000,
};

const CreateStoryModal = ({ onClose, sprintId }: Props) => {
  const dispatch = useAppDispatch();
  const { data: projectData } = useAppSelector((state) => state.activeProject);
  const { sprints, loading } = useAppSelector((state) => state.scrum);
  const currentUser = useAppSelector((state: any) => state.auth?.user);
  const currentUserId = currentUser?._id;

  const [form, setForm] = useState({
    title: '',
    description: '',
    storyPoints: STORY_POINTS[0],
    sprintId: sprintId || '',
    assignee: '',
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedTitle = form.title.trim();
    const trimmedDesc = form.description.trim();

    // QA Validation Checks
    if (!trimmedTitle) {
      setError('Story title is required.');
      return;
    }
    if (trimmedTitle.length < LIMITS.TITLE_MIN) {
      setError(`Story title must be at least ${LIMITS.TITLE_MIN} characters.`);
      return;
    }
    if (trimmedTitle.length > LIMITS.TITLE_MAX) {
      setError(`Story title cannot exceed ${LIMITS.TITLE_MAX} characters.`);
      return;
    }
    if (trimmedDesc.length > LIMITS.DESC_MAX) {
      setError(`Description cannot exceed ${LIMITS.DESC_MAX} characters.`);
      return;
    }

    const projectId = projectData?._id;
    if (!projectId) {
      setError('No active project found.');
      return;
    }

    const apiPayload = {
      projectId,
      title: trimmedTitle,
      description: trimmedDesc || undefined,
      storyPoints: form.storyPoints,
      sprintId: form.sprintId || null,
      assignee: form.assignee || null,
    };

    try {
      await dispatch(createStoryAsync(apiPayload)).unwrap();
      onClose();
    } catch (err: any) {
      setError(err || 'Something went wrong while creating story');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-[2px]" 
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-xl border border-zinc-200/80 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h3 className="text-sm font-semibold text-zinc-900">Add user story</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 cursor-pointer rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
          
          {/* Title */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-zinc-600">Title *</label>
              <span className="text-[10px] text-zinc-400">{form.title.length}/{LIMITS.TITLE_MAX}</span>
            </div>
            <input
              value={form.title}
              maxLength={LIMITS.TITLE_MAX}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="User login with Google"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-zinc-600">
                Description <span className="text-zinc-400">(optional)</span>
              </label>
              <span className="text-[10px] text-zinc-400">{form.description.length}/{LIMITS.DESC_MAX}</span>
            </div>
            <textarea
              value={form.description}
              maxLength={LIMITS.DESC_MAX}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Story Points */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Story points</label>
              <select
                value={form.storyPoints}
                onChange={e => setForm(p => ({ ...p, storyPoints: Number(e.target.value) }))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900 transition-colors cursor-pointer"
              >
                {STORY_POINTS.map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>

            {/* Assignee Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-600">Assignee</label>
                {currentUserId && form.assignee !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, assignee: currentUserId }))}
                    className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-900 hover:underline cursor-pointer transition-colors"
                  >
                    Assign to me
                  </button>
                )}
              </div>

              <select
                value={form.assignee}
                onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900 transition-colors cursor-pointer capitalize"
              >
                <option value="">Unassigned</option>
                {projectData?.members?.map((member: any) => {
                  const mId = member._id || member.user?._id;
                  const mName = member.name || member.user?.name;
                  return (
                    <option key={mId} value={mId}>
                      {mName} {mId === currentUserId ? '(You)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Assign to Sprint / Backlog */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Assign to</label>
            <select
              value={form.sprintId}
              onChange={e => setForm(p => ({ ...p, sprintId: e.target.value }))}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900 transition-colors cursor-pointer"
            >
              <option value="">Global Backlog</option>
              {sprints.map(sp => <option key={sp._id} value={sp._id}>{sp.name}</option>)}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer bg-zinc-900 text-white font-medium text-sm py-2 rounded-lg hover:bg-zinc-800 transition-colors shadow-sm mt-2 disabled:bg-zinc-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add story'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateStoryModal;