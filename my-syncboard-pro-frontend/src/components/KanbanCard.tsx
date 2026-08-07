import { GripVertical, Clock } from 'lucide-react';
import type { KanbanIssue } from "../types/kanban";

interface KanbanCardProps {
  issue: KanbanIssue;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

const KanbanCard = ({ issue, onDragStart }: KanbanCardProps) => {
  const priorityColors = {
    LOW: 'bg-green-500/10 text-green-500',
    MEDIUM: 'bg-amber-500/10 text-amber-500',
    HIGH: 'bg-red-500/10 text-red-500',
  };

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, issue.id)}
      className="group bg-bg border border-border rounded-xl p-4 shadow-sm hover:border-accent hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-3"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${priorityColors[issue.priority]}`}>
          {issue.priority}
        </span>
        <button className="text-text/30 hover:text-text-h opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} />
        </button>
      </div>

      <h4 className="text-sm font-semibold text-text-h mb-4 leading-snug">
        {issue.title}
      </h4>

      <div className="flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex items-center gap-2">
          <img 
            src={issue.assignee.avatar} 
            alt={issue.assignee.name} 
            className="w-6 h-6 rounded-full object-cover border border-border"
            title={issue.assignee.name}
          />
          <span className="text-[10px] font-medium text-text/50">
            {issue.assignee.name.split(' ')[0]}
          </span>
        </div>
        <div className="flex items-center gap-1 text-text/40 text-[10px] font-semibold bg-accent-bg px-1.5 py-0.5 rounded">
          <Clock size={12} />
          {issue.storyPoints} pts
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;