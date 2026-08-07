import { formatDate } from '../utils/formatDate';

interface DetailTimelineCardsProps {
  createdAt?: string;
  updatedAt?: string;
  className?: string;
}

export const DetailTimelineCards = ({ createdAt, updatedAt, className = '' }: DetailTimelineCardsProps) => {
  const hasMeta = Boolean(createdAt || updatedAt);

  if (!hasMeta) return null;

  return (
    <div className={`border-t border-slate-400 p-4 ${className}`.trim()}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-3">Details</p>
      <div className="space-y-2">
        {createdAt && (
          <div className="rounded-md border border-slate-200 bg-white p-2.5 shadow-sm shadow-slate-200/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Created</span>
              <span className="text-[11px] font-medium text-slate-700 text-right">{formatDate(createdAt)}</span>
            </div>
          </div>
        )}

        {updatedAt && (
          <div className="rounded-md border border-slate-200 bg-white p-2.5 shadow-sm shadow-slate-200/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Updated</span>
              <span className="text-[11px] font-medium text-slate-700 text-right">{formatDate(updatedAt)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailTimelineCards;
