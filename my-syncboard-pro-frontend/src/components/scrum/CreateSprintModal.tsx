import { useState } from 'react';
import type { FormEvent } from 'react';
import { X, Calendar } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/storeHooks';
import { createSprintAsync } from '../../features/activeScrum/scrumSlice';

interface Props { 
  onClose: () => void; 
}

const LIMITS = {
  NAME_MIN: 3,
  NAME_MAX: 50,
  GOAL_MAX: 250,
};

const CreateSprintModal = ({ onClose }: Props) => {
  const dispatch = useAppDispatch();
  const activeProject = useAppSelector(state => state.activeProject);
  const { loading } = useAppSelector(state => state.scrum); 

  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = form.name.trim();
    const trimmedGoal = form.goal.trim();

    // QA Validation Checks
    if (!trimmedName) { 
      setError('Sprint name is required.'); 
      return; 
    }
    if (trimmedName.length < LIMITS.NAME_MIN) {
      setError(`Sprint name must be at least ${LIMITS.NAME_MIN} characters.`);
      return;
    }
    if (trimmedName.length > LIMITS.NAME_MAX) {
      setError(`Sprint name cannot exceed ${LIMITS.NAME_MAX} characters.`);
      return;
    }
    if (trimmedGoal.length > LIMITS.GOAL_MAX) {
      setError(`Sprint goal cannot exceed ${LIMITS.GOAL_MAX} characters.`);
      return;
    }
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    const projectId = activeProject.data?._id;
    if (!projectId) {
      setError('No active project found.');
      return;
    }

    const apiPayload = {
      projectId,
      name: trimmedName,
      goal: trimmedGoal || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    };

    try {
      await dispatch(createSprintAsync(apiPayload)).unwrap();
      onClose(); 
    } catch (err: any) {
      setError(err || 'Failed to create sprint');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200/80 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h3 className="text-sm font-semibold text-zinc-900">Create new sprint</h3>
          <button onClick={onClose} className="p-1.5 cursor-pointer rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
          
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-zinc-600">Sprint name *</label>
              <span className="text-[10px] text-zinc-400">{form.name.length}/{LIMITS.NAME_MAX}</span>
            </div>
            <input
              value={form.name}
              maxLength={LIMITS.NAME_MAX}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Sprint 1"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-zinc-600">Sprint goal <span className="text-zinc-400">(optional)</span></label>
              <span className="text-[10px] text-zinc-400">{form.goal.length}/{LIMITS.GOAL_MAX}</span>
            </div>
            <input
              value={form.goal}
              maxLength={LIMITS.GOAL_MAX}
              onChange={e => setForm(p => ({ ...p, goal: e.target.value }))}
              placeholder="What do we want to achieve?"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Start date</label>
              <div className="relative flex items-center">
                <input 
                  type="date" 
                  value={form.startDate} 
                  onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 pl-9 pr-3 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                />
                <Calendar size={15} className="absolute left-3 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">End date</label>
              <div className="relative flex items-center">
                <input 
                  type="date" 
                  min={form.startDate || undefined}
                  value={form.endDate} 
                  onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 pl-9 pr-3 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                />
                <Calendar size={15} className="absolute left-3 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full cursor-pointer bg-zinc-900 text-white font-medium text-sm py-2 rounded-lg hover:bg-zinc-800 transition-colors shadow-sm mt-2 disabled:bg-zinc-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create sprint'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateSprintModal;