import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ISprint } from '../../types/scrum.types';

interface Props {
  sprint: ISprint;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (payload: { name: string; goal: string; startDate?: string; endDate?: string }) => Promise<void> | void;
}

const LIMITS = {
  NAME_MIN: 3,
  NAME_MAX: 50,
  GOAL_MAX: 250,
};

const SprintSettingsModal = ({ sprint, isSubmitting, onClose, onSave }: Props) => {
  const [name, setName] = useState(sprint.name);
  const [goal, setGoal] = useState(sprint.goal ?? '');
  const [startDate, setStartDate] = useState(sprint.startDate ?? '');
  const [endDate, setEndDate] = useState(sprint.endDate ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(sprint.name);
    setGoal(sprint.goal ?? '');
    setStartDate(sprint.startDate ?? '');
    setEndDate(sprint.endDate ?? '');
  }, [sprint]);

  const handleSubmit = async () => {
    setError('');

    const trimmedName = name.trim();
    const trimmedGoal = goal.trim();

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
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    await onSave({
      name: trimmedName,
      goal: trimmedGoal,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/30 px-4 py-6 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <p className="text-lg font-semibold text-zinc-900">Edit sprint settings</p>
            {/* <p className="text-xs text-zinc-500">Update sprint details and planning window.</p> */}
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Sprint name</label>
              <span className="text-[10px] text-zinc-400">{name.length}/{LIMITS.NAME_MAX}</span>
            </div>
            <input 
              value={name} 
              maxLength={LIMITS.NAME_MAX}
              onChange={(e) => setName(e.target.value)} 
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400" 
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Sprint goal</label>
              <span className="text-[10px] text-zinc-400">{goal.length}/{LIMITS.GOAL_MAX}</span>
            </div>
            <input 
              value={goal} 
              maxLength={LIMITS.GOAL_MAX}
              onChange={(e) => setGoal(e.target.value)} 
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400" 
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400 [color-scheme:light]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">End date</label>
              <input
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400 [color-scheme:light]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting || !name.trim()} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400">
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SprintSettingsModal;