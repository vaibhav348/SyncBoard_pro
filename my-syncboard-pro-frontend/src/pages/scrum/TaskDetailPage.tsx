import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, LayoutList,
    Trash2, Send,
    Save,
    SquareX,
    Paperclip,
    Plus,
    ChevronDown,
    User2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/storeHooks';
import {
    fetchSprintsAsync,
    fetchStoriesBySprintAsync, openConfirmModal, removeTask, setTasksByStory, updateTaskInBoard,
} from '../../features/activeScrum/scrumSlice';
import axiosInstance from '../../api/axiosInstance';
import type { ITask, TaskStatus } from '../../types/Board.types';
import { formatDate } from '../../utils/formatDate';
import { usePermissions } from '../../hooks/usePermissions';
import { canDeleteTask, canEditTask, canEditTaskDescription, canEditTaskPriority, canEditTaskTitle, canChangeTaskStatus, canChangeTaskAssignee, normalizeRole } from '../../config/permissions';

// ✅ Import the same rich-text editor used in IssueDetailPage
import { IssueDescriptionEditor } from '../../components/Issue/IssueDescriptionEditor';
import { DetailTimelineCards } from '../../components/DetailTimelineCards';
import { setPendingConfirm } from '../../components/confirmModalController';
import GlobalConfirmModal from '../../components/Globalconfirmmodal';
import { IssueCommentEditor } from '../../components/Issue/IssueCommentEditor';

// ── Prose styles for rendering saved HTML (exact palette used by IssueMainContent) ──────
const proseClass =
    'text-[15px] leading-[1.6] text-slate-800 ' +
    '[&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-2 ' +
    '[&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-2 ' +
    '[&_li]:pl-1 [&_li]:mb-1 ' +
    '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-slate-900 ' +
    '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:text-slate-900 ' +
    '[&_blockquote]:border-l-4 [&_blockquote]:border-indigo-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-700 [&_blockquote]:my-2 ' +
    '[&_pre]:bg-slate-50 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2 [&_pre]:overflow-x-auto ' +
    '[&_code]:bg-slate-100 [&_code]:text-indigo-600 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-xs ' +
    '[&_hr]:border-slate-200 [&_hr]:my-4 ' +
    '[&_p]:mb-2';

type TaskPriority = 'Low' | 'Medium' | 'High';

const STATUSES: TaskStatus[] = ['Todo', 'In-Progress', 'Review', 'Done'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];

// ── Collapsible comment body — YouTube-style "Show more/less" ──────────────
const COMMENT_COLLAPSED_HEIGHT = 120; // px — isse zyada hone par "Show more" dikhega

const CommentBody = ({ html }: { html: string }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (contentRef.current) {
            setIsOverflowing(contentRef.current.scrollHeight > COMMENT_COLLAPSED_HEIGHT + 4);
        }
    }, [html]);

    return (
        <div>
            <div
                ref={contentRef}
                className={`${proseClass} break-words [overflow-wrap:anywhere] overflow-hidden transition-[max-height] duration-300 ease-in-out`}
                style={{
                    maxHeight: expanded ? contentRef.current?.scrollHeight ?? 'none' : COMMENT_COLLAPSED_HEIGHT,
                }}
                dangerouslySetInnerHTML={{ __html: html }}
            />
            {isOverflowing && (
                <button
                    type="button"
                    onClick={() => setExpanded(v => !v)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 mt-1.5 cursor-pointer"
                >
                    {expanded ? 'Show less' : 'Show more'}
                </button>
            )}
        </div>
    );
};

// ✅ Same badge palette as IssueRightSidebar's statusBadge
const statusTheme: Record<TaskStatus, string> = {
    'Todo': 'bg-rose-100 text-rose-800 border-rose-500',
    'In-Progress': 'bg-blue-100 text-blue-800 border-blue-500',
    'Review': 'bg-amber-100 text-amber-800 border-amber-500',
    'Done': 'bg-emerald-100 text-emerald-800 border-emerald-500',
};
const statusLabel: Record<TaskStatus, string> = {
    'Todo': 'New',
    'In-Progress': 'In Progress',
    'Review': 'Ready to Test',
    'Done': 'Closed',
};
// ✅ Same tone as IssueRightSidebar's priorityDot
const priorityDot: Record<TaskPriority, string> = {
    Low: '#94a3b8',
    Medium: '#f59e0b',
    High: '#ef4444',
};

const getAssigneeInfo = (assignee: any) => {
    if (!assignee) return { name: null as string | null, email: null as string | null, initials: null as string | null };
    if (typeof assignee === 'object' && assignee.name) {
        const initials = assignee.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
        return { name: assignee.name as string, email: assignee.email as string | undefined ?? null, initials };
    }
    if (typeof assignee === 'string') return { name: assignee, email: null, initials: assignee.charAt(0).toUpperCase() };
    return { name: null, email: null, initials: null };
};



export const TaskDetailPage = () => {
    const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { activeSprintTasks, tasksByStory, storiesBySprint, backlogStories, sprints } =
        useAppSelector(s => s.scrum) as any;
    const activeProject = useAppSelector(s => s.activeProject.data);
    const currentUser = useAppSelector((state) => state.auth.user) as any;
    const { hasPermission } = usePermissions();

    const projectMembers = activeProject?.members || [];
    const currentUserId = currentUser?._id ?? currentUser?.id;
    const isPrivileged = ['owner', 'manager', 'superadmin', 'admin'].includes(normalizeRole(currentUser?.role));

    // ── Locate the task: Redux first, fall back to API fetch ──────────────────
    const reduxTask: ITask | undefined = useMemo(
        () =>
            activeSprintTasks.find((t: ITask) => t._id === taskId) ||
            Object.values(tasksByStory as Record<string, ITask[]>)
                .flat()
                .find((t: ITask) => t._id === taskId),
        [activeSprintTasks, tasksByStory, taskId]
    );

    const [task, setTask] = useState<ITask | null>(reduxTask ?? null);
    const taskCreatorId = (task as any)?.createdBy?._id ?? (task as any)?.createdBy ?? (task as any)?.createdById;
    const sprintIdStr = typeof (task as any)?.sprintId === 'object'
        ? (task as any).sprintId?._id
        : (task as any)?.sprintId;
    const parentSprint = (sprints as any[]).find(s => s._id === sprintIdStr);
    const canEditTitle = canEditTaskTitle(currentUser as any, task as any);
    const canEditDescription = canEditTaskDescription(currentUser as any, task as any);
    const canEditPriority = canEditTaskPriority(currentUser as any, task as any);
    const canChangeAssignee = canChangeTaskAssignee(currentUser as any, task as any);
    const canEditStatus = canChangeTaskStatus(currentUser as any, task as any);
    const canEditAll = (hasPermission(['story.edit', 'task.edit']) || isPrivileged || Boolean(currentUserId && taskCreatorId && String(currentUserId) === String(taskCreatorId))) && (canEditTitle || canEditDescription || canEditPriority || canChangeAssignee || canEditStatus);
    const canDelete = canDeleteTask(currentUser as any, task as any, parentSprint as any) || hasPermission('task.delete');
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(!reduxTask);
    const canModifyTask = canEditTask(currentUser as any, task as any);

    // ── Description: local copy + edit mode toggle ─────────────────────────
    const [description, setDescription] = useState(reduxTask?.description ?? '');
    const [descriptionEdit, setDescriptionEdit] = useState(false); // ✅ NEW: toggles editor vs preview

    const [titleDraft, setTitleDraft] = useState(reduxTask?.title ?? '');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [savingField, setSavingField] = useState<string | null>(null);
    const TITLE_MIN = 3;
    const TITLE_MAX = 150;
    const titleLength = titleDraft.trim().length;
    const isTitleTooShort = titleLength > 0 && titleLength < TITLE_MIN;
    const isTitleTooLong = titleLength > TITLE_MAX;
    const isTitleEmpty = titleLength === 0;
    const titleHasError = isTitleEmpty || isTitleTooShort || isTitleTooLong;

    const titleErrorMessage = isTitleEmpty
        ? 'Title cannot be empty.'
        : isTitleTooShort
            ? `Title must be at least ${TITLE_MIN} characters.`
            : isTitleTooLong
                ? `Title is too long (${titleLength}/${TITLE_MAX} characters).`
                : null;
    // ── Fetch related sprint/story data when task is known ─────────────────
    useEffect(() => {
        if (!task || !projectId) return;
        const tSprintId = typeof (task as any).sprintId === 'object' ? (task as any).sprintId?._id : (task as any).sprintId;
        const tStoryId = typeof (task as any).storyId === 'object' ? (task as any).storyId?._id : (task as any).storyId;

        if (sprints.length === 0) dispatch(fetchSprintsAsync(projectId));
        if (tSprintId && !storiesBySprint[tSprintId]) dispatch(fetchStoriesBySprintAsync(tSprintId));
        if (tStoryId && !tasksByStory[tStoryId]) {
            axiosInstance
                .get(`/task/get_by_story/${tStoryId}`)
                .then(res => dispatch(setTasksByStory({ storyId: tStoryId, tasks: res.data.tasks || res.data })))
                .catch(() => { });
        }
    }, [task?._id, projectId]);

    // ── Sync from Redux or direct fetch ────────────────────────────────────
    useEffect(() => {
        if (reduxTask) {
            setTask(reduxTask);
            setDescription(reduxTask.description ?? '');
            setTitleDraft(reduxTask.title ?? '');
            setLoading(false);
            return;
        }

        if (!taskId) return;

        let cancelled = false;
        setLoading(true);
        axiosInstance
            .get(`/task/get_by_id/${taskId}`)
            .then(res => {
                if (cancelled) return;
                const fetched = res.data.task || res.data;
                setTask(fetched);
                setDescription(fetched?.description ?? '');
                setTitleDraft(fetched?.title ?? '');
            })
            .catch(() => { if (!cancelled) setNotFound(true); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [taskId, reduxTask?._id]);


    // ── Parent story + sprint lookups ──────────────────────────────────────
    const storyIdStr = typeof (task as any)?.storyId === 'object'
        ? (task as any).storyId?._id
        : (task as any)?.storyId;

    const parentStory = useMemo(() => {
        if (!storyIdStr) return null;
        const inBacklog = (backlogStories as any[]).find(s => s._id === storyIdStr);
        if (inBacklog) return inBacklog;
        for (const sId in storiesBySprint) {
            const found = (storiesBySprint[sId] as any[]).find(s => s._id === storyIdStr);
            if (found) return found;
        }
        if (typeof (task as any)?.storyId === 'object') return (task as any).storyId;
        return null;
    }, [storyIdStr, backlogStories, storiesBySprint, task]);

    // ── Sibling tasks for ‹ › navigation ──────────────────────────────────
    const siblingTasks = useMemo(() => {
        if (!storyIdStr) return [];
        return ((tasksByStory[storyIdStr] as ITask[]) || [])
            .slice()
            .sort((a, b) => ((a as any).position ?? 0) - ((b as any).position ?? 0));
    }, [tasksByStory, storyIdStr]);

    const currentIndex = siblingTasks.findIndex(t => t._id === taskId);
    const prevTask = currentIndex > 0 ? siblingTasks[currentIndex - 1] : null;
    const nextTask = currentIndex !== -1 && currentIndex < siblingTasks.length - 1
        ? siblingTasks[currentIndex + 1]
        : null;

    // ── Generic field updater: optimistic + API confirm ────────────────────
    const updateField = async (patch: Partial<ITask>) => {
        if (!task) return;
        const previous = task;
        const updated = { ...task, ...patch } as ITask;
        setTask(updated);

        setSavingField(Object.keys(patch)[0]);
        if (!canModifyTask) {
            setTask(previous);
            if (patch.status) window.alert('You can only update tasks assigned to you.');
            return;
        }

        try {
            const res = await axiosInstance.patch(`/task/update/${taskId}`, patch);
            const serverTask = res.data.task || res.data;
            setTask(serverTask);
            dispatch(updateTaskInBoard(serverTask));
        } catch (err: any) {
            console.error(err?.response?.data?.message || 'Failed to update task');
            setTask(previous);
            if (err?.response?.status === 403 || err?.response?.status === 401) {
                window.alert('You do not have permission to update this task.');
            }
        } finally {
            setSavingField(null);
        }
    };

    const handleTitleSave = () => {
        if (titleHasError) return;
        setIsEditingTitle(false);
        if (titleDraft.trim() && titleDraft !== task?.title) {
            updateField({ title: titleDraft.trim() });
        } else {
            setTitleDraft(task?.title ?? '');
        }
    };

    // ✅ NEW: called by IssueDescriptionEditor's "Save Details" button
    const handleDescriptionSave = (html: string) => {
        setDescription(html);
        setDescriptionEdit(false);
        void updateField({ description: html });
    };

    const handleDelete = () => {
        if (!taskId || !canDelete) {
            window.alert('You do not have permission to delete this task.');
            return;
        }

        dispatch(openConfirmModal({
            title: 'Delete this task?',
            message: 'This action cannot be undone.',
        }));

        setPendingConfirm(async () => {
            try {
                await axiosInstance.delete(`/task/delete/${taskId}`);
                dispatch(removeTask(taskId));
                navigate(
                    parentSprint
                        ? `/projects/${projectId}/board?sprintId=${parentSprint._id}`
                        : `/projects/${projectId}/backlog`
                );
            } catch (err: any) {
                console.error(err?.response?.data?.message || 'Failed to delete task');
            }
        });
    };

    // ── Comments ───────────────────────────────────────────────────────────
    const [comments, setComments] = useState<any[]>([]);
    const [commentDraft, setCommentDraft] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);

    const [commentsSupported, setCommentsSupported] = useState(true);


    useEffect(() => {
        if (!taskId) return;
        axiosInstance
            .get(`/task-comment/get_by_task/${taskId}`)
            .then(res => setComments(res.data.comments || res.data || []))
            .catch(() => setCommentsSupported(false));
    }, [taskId]);

    const handlePostComment = async () => {
        if (!commentDraft.trim() || !taskId) return;
        try {
            const res = await axiosInstance.post('/task-comment/create', {
                taskId,
                text: commentDraft.trim(),
            });
            setComments(prev => [...prev, res.data.comment || res.data]);
            setCommentDraft('');
        } catch (err: any) {
            console.error(err?.response?.data?.message || 'Failed to post comment');
        }
    };
    const handleSaveComment = async (commentHtml: string) => {
        // 1. FIXED: 'commentDraft' ki jagah 'commentHtml' ko check karein
        // TipTap empty hone par '<p></p>' bhejta hai, toh usey bhi check kar liya
        if (!commentHtml || commentHtml === '<p></p>' || !taskId) {
            setIsCommenting(false);
            return;
        }

        try {
            // 2. FIXED: URL mein extra single quote (') tha create ke baad, usey hata diya
            const res = await axiosInstance.post('/task-comment/create', {
                taskId,
                text: commentHtml
            });

            setComments(prev => [...prev, res.data.comment || res.data]);

            // Agar aap commentDraft state ka aage koi use nahi kar rahe, toh is line ko hata sakte hain
            // setCommentDraft(''); 

        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsCommenting(false);
        }
    };

    // ── Render states ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-sm text-slate-400 font-mono bg-slate-100">
                Loading task…
            </div>
        );
    }

    if (notFound || !task) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-3 bg-slate-100">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <LayoutList size={20} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Task not found</p>
                <button
                    onClick={() => navigate(`/projects/${projectId}/board`)}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 underline"
                >
                    Back to board
                </button>
            </div>
        );
    }


    const { name: assigneeName, email: assigneeEmail } = getAssigneeInfo((task as any).assignee ?? (task as any).assignedTo);
    const currentStatus = (task.status as TaskStatus) || 'Todo';
    const currentPriority = (task.priority as TaskPriority) || 'Low';

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="flex items-start w-full">

                {/* ═══ LEFT: MAIN CONTENT ═══ */}
                <div className="w-full  min-w-0">

                    {/* ── Header block — mirrors IssueHeader ── */}
                    <div className="border-b border-slate-200 bg-white py-6 px-8">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <button
                                        onClick={() =>
                                            navigate(
                                                parentSprint
                                                    ? `/projects/${projectId}/board?sprintId=${parentSprint._id}`
                                                    : `/projects/${projectId}/backlog`
                                            )
                                        }
                                        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                                    >
                                        <ChevronLeft size={14} />
                                        {parentSprint ? 'Back to sprint' : 'Back to backlog'}
                                    </button>
                                </div>

                                {isEditingTitle && canEditTitle ? (
                                    <div className="w-full my-4">
                                        <div className="flex gap-2 items-start">
                                            <input
                                                disabled={!canEditAll}
                                                value={titleDraft}
                                                onChange={(e) => setTitleDraft(e.target.value)}
                                                placeholder="Write a title..."
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && !titleHasError && handleTitleSave()}
                                                maxLength={TITLE_MAX + 20}
                                                className={`text-xl font-semibold leading-relaxed rounded-md border p-2 cursor-text w-full bg-white focus:outline-none focus:ring-2 transition-colors resize-none text-slate-800 ${titleHasError
                                                    ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                                    : 'border-slate-300 focus:ring-indigo-100 focus:border-indigo-300'
                                                    }`}
                                            />
                                            <div className="flex items-center gap-1 shrink-0 pt-2">
                                                <button
                                                    onClick={handleTitleSave}
                                                    disabled={titleHasError}
                                                    title="Save"
                                                    className="p-2 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                                >
                                                    <Save size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setTitleDraft(task.title || '');
                                                        setIsEditingTitle(false);
                                                    }}
                                                    title="Cancel"
                                                    className="p-2 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                >
                                                    <SquareX size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-1.5 px-0.5 mr-20">
                                            <span className="text-[11px] text-red-500">{titleErrorMessage}</span>
                                            <span className={`text-[11px] font-mono shrink-0 ${isTitleTooLong ? 'text-red-500 font-semibold' : 'text-slate-400'
                                                }`}>
                                                {titleLength}/{TITLE_MAX}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <h1
                                        onClick={() => canEditTitle && setIsEditingTitle(true)}
                                        className={`text-xl font-semibold leading-relaxed rounded-lg text-slate-900 border border-dashed ${canEditTitle ? 'border-transparent hover:border-slate-300 cursor-text' : 'border-transparent cursor-default'} p-2 -ml-2 transition-colors max-w-full break-words`}
                                    >
                                        <span className="text-xl font-mono text-indigo-700 uppercase tracking-wide font-semibold mr-1">
                                            #{task._id?.slice(-4) ?? '0000'}
                                        </span>
                                        {task.title}
                                    </h1>
                                )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    disabled={!prevTask}
                                    onClick={() => prevTask && navigate(`/projects/${projectId}/task/${prevTask._id}`)}
                                    className="p-2 rounded-md border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    disabled={!nextTask}
                                    onClick={() => nextTask && navigate(`/projects/${projectId}/task/${nextTask._id}`)}
                                    className="p-2 rounded-md border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>



                        <div className="flex items-end justify-between mt-2 gap-3">

                            {parentStory && (
                                <p className="text-sm text-slate-600 flex items-center gap-1 min-w-0">
                                    <span className="shrink-0">This task belongs to</span>
                                    <button
                                        onClick={() => navigate(`/projects/${projectId}/story/${parentStory._id}`)}
                                        className="text-indigo-600 hover:underline font-medium truncate"
                                        title={`#${parentStory._id?.slice(-4)} ${parentStory.title}`}
                                    >
                                        #{parentStory._id?.slice(-4)} {parentStory.title}
                                    </button>
                                </p>
                            )}

                            {task?.createdBy?.name && (
                                <div className="flex items-center gap-2.5 shrink-0">
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-slate-900">{task?.createdBy?.name}</p>
                                        {(task as any).updatedAt && (
                                            <p className="text-[12px] text-slate-500">{formatDate((task as any).updatedAt)}</p>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[15px] font-semibold text-white shrink-0">
                                        {task?.createdBy?.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            )}
                        </div>



                    </div>

                    {/* ── Body block — mirrors IssueMainContent ── */}
                    <div className="flex-1 min-w-0 space-y-8 p-8 bg-white">

                        {/* Description */}
                        <div>
                            {descriptionEdit && canEditDescription ? (
                                <IssueDescriptionEditor
                                    initialDescription={description}
                                    canEditAll={canEditAll}
                                    onSave={handleDescriptionSave}
                                    onCancel={() => setDescriptionEdit(false)}
                                />
                            ) : (
                                <div className="space-y-4">
                                    <div
                                        onClick={() => canEditAll && setDescriptionEdit(true)}
                                        className={`py-2 min-h-50 transition-colors ${proseClass} break-words [overflow-wrap:anywhere] ${canEditAll ? 'cursor-pointer' : ''} ${description ? '' : 'text-slate-400 italic'}`}
                                        dangerouslySetInnerHTML={{
                                            __html: description || 'No description yet. Click here to add one.',
                                        }}
                                    />
                                    {savingField === 'description' && (
                                        <span className="text-[12px] text-slate-400 font-mono block">Saving…</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Attachments — decorative placeholder, same as IssueMainContent */}
                        <div>
                            <div className="flex items-center justify-between mb-2 bg-slate-100 p-2">
                                <p className="font-mono text-[12px] uppercase tracking-wide text-slate-800">
                                    Attachments
                                    <span className="ml-1.5">·</span>
                                    <span className="ml-1.5">0</span>
                                </p>
                                <button className="w-6 h-6 rounded-md border border-slate-500 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:border-slate-700 transition-colors hover:cursor-pointer">
                                    <Plus size={12} />
                                </button>
                            </div>
                            <div className="border border-dashed border-slate-300 bg-slate-50 p-8 flex flex-col items-center justify-center gap-2 text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer">
                                <Paperclip size={20} />
                                <span className="text-xs">Drop attachments here</span>
                            </div>
                        </div>

                        {/* Comments */}
                        <div>
                            <div className="flex border-b border-slate-200 mb-5">
                                <span className="pb-3 mr-6 text-sm font-medium border-b-2 border-indigo-700 text-slate-900">
                                    Comments
                                    <span className="ml-1.5 font-mono text-xs text-slate-400">{comments.length}</span>
                                </span>
                            </div>

                            {commentsSupported ? (
                                <>
                                    {/* <div className="space-y-3">
                                        <div
                                            onClick={() => { }}
                                            className="w-full border border-slate-200 bg-slate-50 hover:border-slate-300 p-0 min-h-0 text-sm text-slate-700 transition-colors select-none rounded-none"
                                        >
                                            <textarea
                                                value={commentDraft}
                                                onChange={e => setCommentDraft(e.target.value)}
                                                placeholder="Type a new comment here..."
                                                rows={3}
                                                className="w-full bg-transparent p-4 text-sm text-slate-700 focus:outline-none resize-none"
                                            />
                                            <div className="flex justify-end px-3 pb-3">
                                                <button
                                                    onClick={handlePostComment}
                                                    disabled={!commentDraft.trim()}
                                                    className="w-9 h-9 flex items-center cursor-pointer justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                                                >
                                                    <Send size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div> */}

                                    <div className="space-y-3">
                                        {isCommenting ? (
                                            <IssueCommentEditor
                                                onSave={handleSaveComment}
                                                onCancel={() => setIsCommenting(false)}
                                            />
                                        ) : (

                                            <div
                                                className="w-full flex flex-col justify-between border border-slate-200 bg-slate-50 p-0 min-h-0 text-sm text-slate-700 transition-colors select-none rounded-none space-y-3 h-32 cursor-text hover:border-slate-300"
                                                onClick={() => setIsCommenting(true)}
                                            >
                                                <div

                                                    className="w-full   p-4  text-sm text-slate-400 focus:outline-none resize-none"
                                                > Type a new comment here...</div>
                                                <div className="flex justify-end   px-3 pb-3">
                                                    <button
                                                        onClick={handlePostComment}
                                                        disabled={!commentDraft.trim()}
                                                        className="w-9 h-9 flex items-center cursor-pointer justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                                                    >
                                                        <Send size={14} />
                                                    </button>
                                                </div>
                                            </div>




                                        )}
                                    </div>

                                    <div className="space-y-5 mt-6">
                                        {comments.length === 0 ? (
                                            <p className="text-[12px] text-slate-400 italic py-4 text-center">
                                                No comments yet. Be the first to comment.
                                            </p>
                                        ) : (
                                            comments.map((comment) => (
                                                <div key={comment._id} className="flex items-start gap-3 text-sm border-b border-slate-200 pb-4 last:border-0">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700 shrink-0 mt-1 mb-0.5 uppercase">
                                                        {comment?.userId.name[0]}
                                                    </div>
                                                    <div className="flex flex-col min-w-0 space-y-2 flex-1">
                                                        <div className="flex flex-col items-start">
                                                            <span className="font-semibold text-slate-900">{comment.userId.name}</span>
                                                            <span className="text-xs text-slate-700">

                                                                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </span>
                                                        </div>


                                                        <CommentBody html={comment.content} />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p className="text-[12px] text-slate-400 italic">
                                    Comments aren't available yet — backend endpoint not connected.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ RIGHT: SIDEBAR — mirrors IssueRightSidebar ═══ */}
                <aside className="w-full lg:w-72.5 bg-slate-100 shrink-0 space-y-4 p-4 border border-l-slate-200 border-t-0 border-r-0 border-b-0 text-slate-800 min-h-screen">

                    {/* Status */}
                    <div className="p-2">
                        <div className="flex items-center justify-start gap-4">
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-900">Status</p>
                            <div className="relative inline-block">
                                <select
                                    value={currentStatus}
                                    onChange={e => updateField({ status: e.target.value as TaskStatus })}
                                    disabled={!canEditStatus}
                                    className={`appearance-none  flex justify-between items-center gap-2 text-xs font-semibold tracking-wider uppercase pl-3 pr-7 py-1.5 rounded-md border transition-all duration-200 focus:outline-none ${statusTheme[currentStatus]} ${!canModifyTask ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {STATUSES.map(s => (
                                        <option className="bg-white text-slate-800 normal-case" key={s} value={s}>
                                            {statusLabel[s]}
                                        </option>
                                    ))}
                                </select>
                                {canModifyTask &&

                                    <ChevronDown size={13} className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current`} />
                                }
                            </div>
                        </div>
                    </div>

                    {/* Priority — styled as a FieldDropdown row */}
                    <div className="p-2 pt-6">
                        <div className="relative">
                            <div className="w-full flex items-center justify-between py-3">
                                <span className="text-xs font-medium tracking-wide text-slate-800 capitalize">Priority</span>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-sm font-medium text-slate-800 capitalize">{currentPriority}</span>
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: priorityDot[currentPriority] }}
                                    />
                                    {
                                        canEditAll &&
                                        <ChevronDown size={14} className="text-slate-700" />
                                    }
                                </div>
                            </div>
                            <select
                                value={currentPriority}
                                onChange={e => updateField({ priority: e.target.value as TaskPriority })}
                                disabled={!canEditAll}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
                            >
                                {PRIORITIES.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Assigned to */}
                    <div className="border-t border-slate-400 px-2 pt-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-3.5">Assigned to</p>
                        {assigneeName ? (
                            <div className="flex items-center pb-4 gap-3.5 mb-4 bg-slate-50 border border-slate-100 p-2.5">
                                <div className="w-9 h-9 bg-indigo-10 border border-indigo-400 flex items-center justify-center text-xs font-bold text-indigo-800 shrink-0">
                                    {assigneeName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate capitalize tracking-wide">
                                        {assigneeName}
                                    </p>
                                    {assigneeEmail && (
                                        <p className="text-xs text-slate-600 truncate mt-0.5">{assigneeEmail}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center pb-4 gap-3.5 mb-4 bg-slate-50 border border-slate-100 p-2.5">
                                <div className="w-9 h-9 bg-indigo-10 border border-indigo-400 flex items-center justify-center text-xs font-bold text-indigo-800 shrink-0">
                                    <User2 size={14} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate capitalize tracking-wide">
                                        UNASSIGNED
                                    </p>

                                    <p className="text-xs text-slate-600 truncate mt-0.5">Please assige someone</p>
                                </div>
                            </div>
                        )}

                        {canChangeAssignee && (
                            <div className="relative">
                                <button className="w-full text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 py-2.5 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                                    <Plus size={14} /> {assigneeName ? 'Reassign' : 'Add assignee'}
                                </button>
                                <select
                                    value=""
                                    onChange={e => e.target.value && updateField({ assignedTo: e.target.value } as any)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                >
                                    <option value="" disabled>
                                        {assigneeName ? 'Reassign' : 'Add assignee'}
                                    </option>
                                    {projectMembers.map((m: any) => (
                                        <option key={m._id || m.id} value={m._id || m.id}>
                                            {m.name || m.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <DetailTimelineCards createdAt={(task as any).createdAt} updatedAt={(task as any).updatedAt} />

                    {/* Actions */}
                    <div className="border-t border-slate-400 p-4">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-3.5">Actions</p>
                        <div className="grid grid-cols-4 gap-2">
                            {canDelete && (
                                <button
                                    title="Delete"
                                    onClick={handleDelete}
                                    className="flex flex-col items-center justify-center aspect-square rounded-sm border border-slate-400 bg-white text-slate-800 hover:border-red-400 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                                >
                                    <Trash2 size={16} />
                                    <span className="text-[8px] font-medium uppercase tracking-wider mt-1.5 block opacity-80">
                                        Delete
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
            <GlobalConfirmModal />
        </div>
    );
};

export default TaskDetailPage;