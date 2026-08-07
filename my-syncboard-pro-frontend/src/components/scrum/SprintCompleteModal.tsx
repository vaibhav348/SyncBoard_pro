import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { ISprint } from '../../types/scrum.types';

interface Props {
  sprint: ISprint;
  targetSprints: ISprint[];
  completedCount: number;
  incompleteCount: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: { moveIncompleteTo: 'backlog' | 'sprint'; targetSprintId?: string }) => Promise<void> | void;
}

const SprintCompleteModal = ({ sprint, targetSprints, completedCount, incompleteCount, isSubmitting, onClose, onConfirm }: Props) => {
  const [moveIncompleteTo, setMoveIncompleteTo] = useState<'backlog' | 'sprint'>('backlog');
  const [targetSprintId, setTargetSprintId] = useState('');

  const eligibleTargetSprints = useMemo(() => targetSprints.filter((item) => item._id !== sprint._id && item.status === 'planned'), [targetSprints, sprint._id]);

  const handleSubmit = async () => {
    await onConfirm({
      moveIncompleteTo,
      targetSprintId: moveIncompleteTo === 'sprint' ? targetSprintId || eligibleTargetSprints[0]?._id : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/30 px-4 py-6 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Complete sprint</p>
            <p className="text-xs text-zinc-500">Choose what happens to unfinished work when this sprint closes.</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-800">Sprint summary</p>
            <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-zinc-400">Completed work</p>
                <p className="mt-1 font-semibold text-zinc-900">{completedCount} items</p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-zinc-400">Incomplete work</p>
                <p className="mt-1 font-semibold text-zinc-900">{incompleteCount} items</p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Rollover destination</label>
            <select
              value={moveIncompleteTo}
              onChange={(e) => setMoveIncompleteTo(e.target.value as 'backlog' | 'sprint')}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400"
            >
              <option value="backlog">Move to backlog</option>
              <option value="sprint">Move to another planned sprint</option>
            </select>
          </div>

          {moveIncompleteTo === 'sprint' && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Target sprint</label>
              <select
                value={targetSprintId}
                onChange={(e) => setTargetSprintId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400"
              >
                {eligibleTargetSprints.length === 0 ? (
                  <option value="">No planned sprints available</option>
                ) : (
                  <>
                    <option value="">Select a sprint</option>
                    {eligibleTargetSprints.map((item) => (
                      <option key={item._id} value={item._id}>{item.name}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting || (moveIncompleteTo === 'sprint' && eligibleTargetSprints.length > 0 && !targetSprintId)} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400">
            {isSubmitting ? 'Completing...' : 'Complete sprint'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SprintCompleteModal;
