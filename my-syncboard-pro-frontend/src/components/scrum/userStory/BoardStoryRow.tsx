import { useState } from 'react';
import { Plus, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { TaskCard } from './TaskCard';
import type { BoardStory, TaskStatus, ITask } from '../../../types/Board.types';
import { useAppSelector } from '../../../hooks/storeHooks';

const COLUMNS: TaskStatus[] = ['Todo', 'In-Progress', 'Review', 'Done'];

interface BoardStoryRowProps {
    story: BoardStory;
    isAlt: boolean;
    onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
    onDropTask: (e: React.DragEvent, storyId: string, newStatus: TaskStatus) => void;
    onAddTask: (storyId: string) => void;
}

export const BoardStoryRow = ({ story, isAlt, onMoveTask, onDropTask, onAddTask }: BoardStoryRowProps) => {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();

    // Redux se direct is story ke tasks fetch ho rahe hain — drag-drop hote hi
    // yeh list khud-ba-khud update ho jaati hai (updateTaskInBoard reducer ki wajah se)
    const storyTasks = useAppSelector(s => s.scrum.tasksByStory[story._id]) || [];

    const initials = story?.assignee?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

    // Progress bar ke liye calculation
    const doneCount = storyTasks.filter(t => t.status === 'Done').length;
    const pct = storyTasks.length > 0 ? Math.round((doneCount / storyTasks.length) * 100) : 0;

    // Column jispe abhi task drag karke le jaaya ja raha hai — sirf visual highlight ke liye
    const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

    return (
        <div className={`flex min-h-[150px] ${isAlt ? 'bg-zinc-50' : 'bg-white'}`}>

            {/* ── Left: Story info panel ── */}
            <div className="w-[280px] shrink-0 border-r border-zinc-300 p-4 flex flex-col justify-between gap-2">
                <div>
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                       <div
                         onClick={() => navigate(`/projects/${projectId}/story/${story._id}`)}
                         className='flex items-start gap-1.5 mb-2 cursor-pointer'
                       >
                        <span className="font-mono text-blue-500 text-[12px] font-semibold shrink-0 mt-0.5">
                            #{story._id?.slice(-4) ?? '0000'}
                        </span>
                        <p className="text-[12.5px] font-medium text-zinc-800 leading-snug line-clamp-4 hover:text-blue-700 hover:underline   break-all    ">
                            {story.title}
                        </p>
                       </div>
                        {story?.assignee && (
                        
                                <div

                                    className={`w-5 h-5 cursor-pointer rounded-full flex items-center justify-center text-[8px] font-bold hover:bg-zinc-600 shrink-0 ${initials
                                        ? 'bg-zinc-800 text-white'
                                        : 'bg-zinc-100 border border-zinc-200'
                                        }`}
                                >
                                    {initials ?? <User size={9} className="text-zinc-400" />}
                                </div>
                               
                        )}
                    </div>

                    {storyTasks.length > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="font-mono text-[9px] text-zinc-400 shrink-0">{doneCount}/{storyTasks.length}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 px-1.5 py-0.5 rounded">
                            {story.storyPoints ? `${story.storyPoints} SP` : '0 SP'}
                        </span>
                       
                    </div>
                    <button
                        type="button"
                        onClick={() => onAddTask(story._id)}
                        className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-zinc-800 bg-white hover:bg-zinc-50 border border-zinc-200 rounded px-2 py-1 transition-colors"
                    >
                        <Plus size={10} /> Task
                    </button>
                </div>
            </div>

            {/* ── Right: Task columns ── */}
            <div className="flex flex-1">
                {COLUMNS.map(col => {
                    // ✅ position field se sort karte hain taaki order stable rahe
                    // (naya move-in task hamesha end me dikhega, existing tasks apni jagah pe rahenge)
                    const colTasks = storyTasks
                        .filter(t => (t.status ?? 'Todo') === col)
                        .slice()
                        .sort((a, b) => ((a as any).position ?? 0) - ((b as any).position ?? 0));
                    const isDragOver = dragOverCol === col;

                    return (
                        <div
                            key={col}
                            onDragOver={(e) => {
                                e.preventDefault(); // required to allow dropping
                                setDragOverCol(col);
                            }}
                            onDragLeave={() => setDragOverCol(null)}
                            onDrop={(e) => {
                                setDragOverCol(null);
                                onDropTask(e, story._id, col);
                            }}
                            className={`flex-1 p-2.5 border-r border-zinc-200 last:border-r-0 min-h-[120px] transition-colors ${isDragOver ? 'bg-blue-50/60' : ''
                                }`}
                        >
                            {colTasks.length === 0 ? (
                                <div
                                    className={`h-full min-h-[80px] rounded-lg border border-dashed flex items-center justify-center transition-colors ${isDragOver ? 'border-blue-300 bg-blue-50/40' : 'border-white'
                                        }`}
                                >
                                    {/* <span className="text-[12px] text-zinc-300">—</span> */}
                                </div>
                            ) : (
                                colTasks.map(task => (
                                    <TaskCard
                                        key={task._id}
                                        task={task as unknown as ITask}
                                        onMove={onMoveTask}
                                    />
                                ))
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BoardStoryRow;