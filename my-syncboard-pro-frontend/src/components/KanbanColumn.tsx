import { MoreHorizontal, Plus } from 'lucide-react';
import type { KanbanIssue, IssueStatus } from '../types/kanban';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  title: string;
  status: IssueStatus;
  issues: KanbanIssue[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (status: IssueStatus) => void;
}

const KanbanColumn = ({ title, status, issues, onDragStart, onDrop }: KanbanColumnProps) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Zaroori hai drop allow karne ke liye
  };

  return (
    <div 
      className="flex-shrink-0 w-80 flex flex-col bg-accent-bg/20 rounded-2xl h-full border border-border/50"
      onDragOver={handleDragOver}
      onDrop={() => onDrop(status)}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-text-h uppercase tracking-wide">{title}</h3>
          <span className="bg-bg border border-border text-text/60 text-xs font-semibold px-2 py-0.5 rounded-full">
            {issues.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-bg rounded text-text/50 hover:text-text-h transition-colors">
            <Plus size={16} />
          </button>
          <button className="p-1 hover:bg-bg rounded text-text/50 hover:text-text-h transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Issue List (Drop Zone) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {issues.map(issue => (
          <KanbanCard key={issue.id} issue={issue} onDragStart={onDragStart} />
        ))}
        {issues.length === 0 && (
          <div className="border-2 border-dashed border-border rounded-xl h-24 flex items-center justify-center text-xs font-medium text-text/40">
            Drop issues here
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;