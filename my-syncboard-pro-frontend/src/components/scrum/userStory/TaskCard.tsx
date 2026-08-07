import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import type { TaskStatus, ITask } from '../../../types/Board.types';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../../hooks/storeHooks';
import { canEditTask } from '../../../config/permissions';

const COLUMNS: TaskStatus[] = ['Todo', 'In-Progress', 'Review', 'Done'];

const getAssigneeInfo = (assignee: any) => {
  if (!assignee) return { name: 'Unassigned', initials: null };
  if (typeof assignee === 'object' && assignee.name) {
    const initials = assignee.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
    return { name: assignee.name, initials };
  }
  if (typeof assignee === 'string') return { name: assignee, initials: assignee.charAt(0).toUpperCase() };
  return { name: 'Unassigned', initials: null };
};

export const TaskCard = ({ task, onMove }: { task: ITask; onMove: (id: string, s: TaskStatus) => void }) => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const currentUser = useAppSelector((state) => state.auth.user);
  console.log("task", task);

  const currentStatus = task.status || 'Todo';
  const idx = COLUMNS.indexOf(currentStatus);
  const prevStatus = idx > 0 ? COLUMNS[idx - 1] : null;
  const nextStatus = idx < COLUMNS.length - 1 ? COLUMNS[idx + 1] : null;
  const { name, initials } = getAssigneeInfo(task.assignedTo);
  const canInteractWithTask = canEditTask(currentUser as any, task as any);
  const handleOpenDetail = () => {
    navigate(`/projects/${projectId}/task/${task._id}`);
  };
  const priorityColorsText: Record<string, string> = {
    Low: 'text-green-500',
    Medium: ' text-amber-500',
    High: ' text-red-500',
  };
  const priorityColorsBg: Record<string, string> = {
    Low: 'bg-green-500 ',
    Medium: 'bg-amber-500',
    High: 'bg-red-500 ',
  };


  return (
    <div
      draggable={canInteractWithTask}
      onDragStart={(e) => {
        // storyId object ya string dono form me aa sakta hai backend se, dono handle karte hain
        const rawStoryId = (task as any).storyId;
        const sourceStoryId = typeof rawStoryId === 'object' ? rawStoryId?._id : rawStoryId;

        e.dataTransfer.setData('taskId', task._id);
        e.dataTransfer.setData('sourceStoryId', sourceStoryId || '');
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`bg-white border border-zinc-200 rounded-lg p-3 space-y-2.5 group  mb-2  active:opacity-60  ${canInteractWithTask && "hover:border-zinc-300 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"}`}  >
      {/* Title row */}
      <div

        className="flex items-start justify-between gap-2 min-h-8">
        <p onClick={handleOpenDetail}
          className="text-[12px] cursor-pointer font-medium line-clamp-3 text-zinc-600 leading-snug flex-1
          hover:text-black    break-all 
          ">
          <span className="font-mono text-blue-500 font-semibold mr-1 text-[12px]">
            #{task._id?.slice(-4) ?? '0000'}
          </span>
          {task.title}
        </p>
        <button className="text-zinc-300 cursor-pointer hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
          <MoreVertical size={12} />
        </button>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {
            initials &&
            <div
              title={name}
              className={`w-5 h-5 cursor-pointer rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${task?.assignedTo?._id === currentUser?.id ? "bg-red-600 hover:bg-blue-600" : "bg-zinc-800 hover:bg-zinc-600"}  text-white
              `}
            >
              {

                task?.assignedTo?._id === currentUser?.id ? "You" :
                  initials
              }
            </div>
          }
          <div className='flex justify-between items-center'>

            <span className={` font-bold px-1 py-1 rounded-full  ${priorityColorsBg[task.priority ?? 'Medium']}`}>

            </span>
            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${priorityColorsText[task.priority ?? 'Medium']}`}>
              {task.priority}
            </span>
          </div>
        </div>

        {/* Arrow buttons — fallback for when drag-and-drop isn't convenient (e.g. touch devices) */}

        {
          canInteractWithTask &&

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              disabled={!prevStatus || !canInteractWithTask}
              onClick={() => prevStatus && onMove(task._id, prevStatus)}
              className="w-5 h-5 flex items-center justify-center cursor-pointer rounded border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={10} />
            </button>
            <button
              type="button"
              disabled={!nextStatus || !canInteractWithTask}
              onClick={() => nextStatus && onMove(task._id, nextStatus)}
              className="w-5 h-5 flex items-center justify-center cursor-pointer rounded border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={10} />
            </button>
          </div>
        }
      </div>
    </div>
  );
};

export default TaskCard;