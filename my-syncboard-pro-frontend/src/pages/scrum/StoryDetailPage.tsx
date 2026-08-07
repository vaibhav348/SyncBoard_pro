import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    LayoutList, Plus, Send, Trash2,
    SquareX, Save, ChevronLeft, User2
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../../hooks/storeHooks';
import { openConfirmModal } from '../../features/activeScrum/scrumSlice';
import axiosInstance from '../../api/axiosInstance';
import { formatDate } from '../../utils/formatDate';
import CreateTaskModal from '../../components/scrum/CreateTaskModal';
import type { ITask } from '../../types/scrum.types';
import { setPendingConfirm } from '../../components/confirmModalController';
import { IssueDescriptionEditor } from '../../components/Issue/IssueDescriptionEditor';
import { IssueCommentEditor } from '../../components/Issue/IssueCommentEditor';
import GlobalConfirmModal from '../../components/Globalconfirmmodal';
import { DetailTimelineCards } from '../../components/DetailTimelineCards';
import { usePermissions } from '../../hooks/usePermissions';
import { canDeleteStory, canEditStory } from '../../config/permissions';

interface StoryComment {
    _id: string;
    content?: string;
    text?: string;
    createdAt: string;
    authorName?: string;
    userId?: {
        _id: string;
        name: string;
    };
}

interface IUserStoryData {
    _id: string;
    projectId: string;
    sprintId?: string | { _id: string; name: string } | null;
    assignee?: { _id: string; name: string; email: string } | string | null;
    title: string;
    description?: string;
    storyPoints: number;
    position: number;
    createdAt?: string;
    updatedAt?: string;
}

// ── Prose styles for rendering saved HTML ──────
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

/* ── Task status badge styles ── */
const taskStatusStyle: Record<string, string> = {
    'Todo': 'bg-rose-100 text-rose-800 border-rose-500',
    'In-Progress': 'bg-blue-100 text-blue-800 border-blue-500',
    'Review': 'bg-amber-100 text-amber-800 border-amber-500',
    'Done': 'bg-emerald-100 text-emerald-800 border-emerald-500',
};

const statusLabel: Record<string, string> = {
    'Todo': 'New',
    'In-Progress': 'In Progress',
    'Review': 'Ready to Test',
    'Done': 'Closed',
};

const getAssigneeInfo = (assignee: IUserStoryData['assignee']) => {
    if (!assignee) return { name: null as string | null, email: null as string | null, initials: null as string | null };
    if (typeof assignee === 'object' && assignee.name) {
        const initials = assignee.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
        return { name: assignee.name, email: assignee.email ?? null, initials };
    }
    return { name: null, email: null, initials: null };
};

// ── Collapsible comment body — YouTube-style "Show more/less" ──────────────
const COMMENT_COLLAPSED_HEIGHT = 120; // px

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

export const StoryDetailPage = () => {
    const { projectId, storyId } = useParams<{ projectId: string; storyId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();

    const { storiesBySprint, backlogStories, sprints } = useAppSelector((s) => s.scrum) as any;
    const activeProject = useAppSelector((s) => s.activeProject.data);
    const currentUser = useAppSelector((s) => s.auth.user) as any;
    const projectMembers = activeProject?.members || [];
    const { hasPermission } = usePermissions();

    const canEditAll = hasPermission(['story.edit', 'task.edit']) && canEditStory(currentUser as any);
    const canDelete = hasPermission('story.delete') && canDeleteStory(currentUser as any);

    const reduxStory: IUserStoryData | undefined = useMemo(() => {
        const inBacklog = (backlogStories as IUserStoryData[]).find((s) => s._id === storyId);
        if (inBacklog) return inBacklog;
        for (const sId in storiesBySprint) {
            const found = (storiesBySprint[sId] as IUserStoryData[]).find((s) => s._id === storyId);
            if (found) return found;
        }
        return undefined;
    }, [backlogStories, storiesBySprint, storyId]);

    const [story, setStory] = useState<IUserStoryData | null>(reduxStory ?? null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(!reduxStory);
    const [description, setDescription] = useState(reduxStory?.description ?? '');
    const [descriptionEdit, setDescriptionEdit] = useState(false);
    const [titleDraft, setTitleDraft] = useState(reduxStory?.title ?? '');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [pointsDraft, setPointsDraft] = useState(reduxStory?.storyPoints ?? 0);
    const [savingField, setSavingField] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
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
    useEffect(() => {
        if (reduxStory) {
            setStory(reduxStory);
            setDescription(reduxStory.description ?? '');
            setTitleDraft(reduxStory.title ?? '');
            setPointsDraft(reduxStory.storyPoints ?? 0);
            setLoading(false);
            return;
        }
        if (!storyId) return;
        let cancelled = false;
        setLoading(true);
        axiosInstance
            .get(`/story/get_by_id/${storyId}`)
            .then((res) => {
                if (cancelled) return;
                const fetched = res.data.story || res.data;
                setStory(fetched);
                setDescription(fetched?.description ?? '');
                setTitleDraft(fetched?.title ?? '');
                setPointsDraft(fetched?.storyPoints ?? 0);
            })
            .catch(() => { if (!cancelled) setNotFound(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [storyId, reduxStory?._id]);

    const sprintIdStr = typeof story?.sprintId === 'object' ? story.sprintId?._id : story?.sprintId;
    const parentSprint = (sprints as any[]).find((s) => s._id === sprintIdStr);
    const handleBack = () => {
        const from = (location.state as { from?: string } | null)?.from;
        if (from) {
            navigate(from);
            return;
        }

        navigate(
            parentSprint
                ? `/projects/${projectId}/board?sprintId=${parentSprint._id}`
                : `/projects/${projectId}/backlog`
        );
    };

    const updateField = async (patch: Partial<IUserStoryData>) => {
        if (!story) return;
        const previous = story;
        const updated = { ...story, ...patch } as IUserStoryData;

        if (patch.assignee && typeof patch.assignee === 'string') {
            const member = projectMembers.find((m: any) => (m._id || m.id) === patch.assignee);
            if (member) {
                updated.assignee = {
                    _id: patch.assignee,
                    name: member.name,
                    email: member.email,
                };
            }
        }

        setStory(updated);
        setSavingField(Object.keys(patch)[0]);
        setSaveError(null);
        if (!hasPermission('story.edit')) {
            setStory(previous);
            setSaveError('You do not have permission to update this story.');
            return;
        }

        try {
            const res = await axiosInstance.patch(`/story/update/${storyId}`, patch);
            const saved = (res.data.story || res.data) as IUserStoryData;
            setStory(saved);
            if (saved.title !== undefined) setTitleDraft(saved.title);
            if (saved.description !== undefined) setDescription(saved.description ?? '');
            if (saved.storyPoints !== undefined) setPointsDraft(saved.storyPoints);
        } catch (err: any) {
            console.error(err?.response?.data?.message || 'Failed to update story');
            setStory(previous);
            setSaveError(err?.response?.data?.message || 'Failed to save changes. Please try again.');
            if (err?.response?.status === 403 || err?.response?.status === 401) {
                setSaveError('You do not have permission to update this story.');
            }
        } finally {
            setSavingField(null);
        }
    };

    const handleTitleSave = () => {
        if (titleHasError) return;
        setIsEditingTitle(false);
        if (titleDraft.trim() && titleDraft !== story?.title) {
            updateField({ title: titleDraft.trim() });
        } else {
            setTitleDraft(story?.title ?? '');
        }
    };

    const handleDescriptionSave = (html: string) => {
        setDescription(html);
        setDescriptionEdit(false);
        void updateField({ description: html });
    };

    const handlePointsSave = () => {
        if (pointsDraft !== story?.storyPoints) updateField({ storyPoints: pointsDraft });
    };

    const handleDelete = () => {
        if (!storyId || !canDelete) {
            window.alert('You do not have permission to delete this story.');
            return;
        }
        dispatch(openConfirmModal({
            title: 'Delete this user story?',
            message: 'All linked tasks will lose their parent story. This cannot be undone.',
        }));
        setPendingConfirm(async () => {
            try {
                await axiosInstance.delete(`/story/delete/${storyId}`);
                navigate(
                    parentSprint
                        ? `/projects/${projectId}/board?sprintId=${parentSprint._id}`
                        : `/projects/${projectId}/backlog`
                );
            } catch (err: any) {
                console.error(err?.response?.data?.message || 'Failed to delete story');
            }
        });
    };

    const [tasks, setTasks] = useState<ITask[]>([]);
    const [showCreateTask, setShowCreateTask] = useState(false);

    const fetchTasks = useCallback(async () => {
        if (!storyId) return;
        try {
            const res = await axiosInstance.get(`/task/get_by_story/${storyId}`);
            setTasks(res.data.tasks || res.data || []);
        } catch {
            setTasks([]);
        }
    }, [storyId]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleTaskCreated = (task: ITask) => {
        setTasks((prev) => [...prev, task]);
    };

    const [comments, setComments] = useState<StoryComment[]>([]);
    const [isCommenting, setIsCommenting] = useState(false);
    const [commentsSupported, setCommentsSupported] = useState(true);
    const [commentError, setCommentError] = useState<string | null>(null);

    useEffect(() => {
        if (!storyId) return;
        axiosInstance
            .get(`/story-comment/get_by_story/${storyId}`)
            .then((res) => setComments(res.data.comments || res.data || []))
            .catch(() => setCommentsSupported(false));
    }, [storyId]);

    const handleSaveComment = async (commentHtml: string) => {
        if (!commentHtml || commentHtml === '<p></p>' || !storyId) {
            setIsCommenting(false);
            return;
        }
        setCommentError(null);
        try {
            const res = await axiosInstance.post('/story-comment/create', {
                storyId,
                text: commentHtml
            });
            setComments(prev => [...prev, res.data.comment || res.data]);
        } catch (error: any) {
            console.error('Failed to add comment:', error);
            setCommentError(error?.response?.data?.message || 'Failed to add comment. Please try again.');
        } finally {
            setIsCommenting(false);
        }
    };

    /* ── Loading state ── */
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-sm text-slate-400 font-mono bg-slate-100">
                Loading story…
            </div>
        );
    }

    /* ── Not found state ── */
    if (notFound || !story) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-3 bg-slate-100">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <LayoutList size={20} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Story not found</p>
                <button
                    onClick={handleBack}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 underline"
                >
                    Back to backlog
                </button>
            </div>
        );
    }

    const { name: assigneeName, email: assigneeEmail } = getAssigneeInfo(story.assignee);
    const doneCount = tasks.filter((t) => t.status === 'Done').length;

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="flex items-start w-full">

                {/* ═══ LEFT: MAIN CONTENT ═══ */}
                <div className="w-full min-w-0">

                    {/* ── Header block ── */}
                    <div className="border-b border-slate-200 bg-white py-6 px-8">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <button
                                        onClick={handleBack}
                                        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                                    >
                                        <ChevronLeft size={14} />
                                        {parentSprint ? 'Back to sprint' : 'Back to backlog'}
                                    </button>
                                </div>

                                {isEditingTitle && canEditAll ? (
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
                                                        setTitleDraft(story.title || '');
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
                                        onClick={() => canEditAll && setIsEditingTitle(true)}
                                        className={`text-xl font-semibold leading-relaxed rounded-lg text-slate-900 border border-dashed ${canEditAll ? 'border-transparent hover:border-slate-300 cursor-text' : 'border-transparent cursor-default'} p-2 -ml-2 transition-colors max-w-full break-words`}
                                    >
                                        <span className="text-xl font-mono text-indigo-700 uppercase tracking-wide font-semibold mr-1">
                                            #{story._id?.slice(-4) ?? '0000'}
                                        </span>
                                        {story.title}
                                    </h1>
                                )}
                            </div>
                        </div>

                        <div className="flex items-end justify-between mt-2 gap-3">
                            {parentSprint ? (
                                <p className="text-sm text-slate-600 flex items-center gap-1 min-w-0">
                                    <span className="shrink-0">This story belongs to</span>
                                    <button
                                        onClick={() => navigate(`/projects/${projectId}/board?sprintId=${parentSprint._id}`)}
                                        className="text-indigo-600 hover:underline font-medium truncate"
                                        title={`#${parentSprint._id?.slice(-4)} ${parentSprint.name}`}
                                    >
                                        #{parentSprint._id?.slice(-4)} {parentSprint.name}
                                    </button>
                                </p>
                            ) : (
                                <div className='h-10'></div>
                            )}
                            {assigneeName && (
                                <div className="flex items-center gap-2.5 shrink-0">
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-slate-900 truncate max-w-[160px]">{assigneeName}</p>
                                        {story.updatedAt && (
                                            <p className="text-[12px] text-slate-500">{formatDate(story.updatedAt)}</p>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[15px] font-semibold text-white shrink-0">
                                        {assigneeName.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Body block ── */}
                    <div className="flex-1 min-w-0 space-y-8 p-8 bg-white">

                        {/* Description */}
                        <div>
                            {descriptionEdit && canEditAll ? (
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

                        {/* Tasks section */}
                        <div>
                            <div className="flex items-center justify-between mb-2 bg-slate-100 p-2">
                                <p className="font-mono text-[12px] uppercase tracking-wide text-slate-800">
                                    Tasks
                                    <span className="ml-1.5">·</span>
                                    <span className="ml-1.5">
                                        {doneCount}/{tasks.length}
                                    </span>
                                </p>
                                <button
                                    onClick={() => setShowCreateTask(true)}
                                    className="w-6 h-6 rounded-md border border-slate-500 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:border-slate-700 transition-colors hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus size={12} />
                                </button>
                            </div>

                            {tasks.length === 0 ? (
                                <div className="border border-dashed border-slate-300 bg-slate-50 p-8 flex flex-col items-center justify-center gap-2 text-slate-700">
                                    <span className="text-xs">No tasks yet</span>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {tasks.map((t) => (
                                        <div
                                            key={t._id}
                                            onClick={() => navigate(`/projects/${projectId}/task/${t._id}`)}
                                            className="flex items-center justify-between border border-slate-200 bg-slate-50 hover:border-slate-300 px-3.5 py-2.5 hover:bg-slate-100/70 cursor-pointer transition-colors group"
                                        >
                                            <span className="text-sm text-slate-700 truncate group-hover:text-slate-900 transition-colors min-w-0">
                                                {t.title}
                                            </span>
                                            <span className={`font-mono text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md border shrink-0 ml-3 ${taskStatusStyle[t.status ?? 'Todo'] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                {statusLabel[t.status ?? 'Todo'] || t.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                                    {commentError && (
                                        <p className="text-[12px] text-red-600 mb-3">{commentError}</p>
                                    )}
                                    <div className="space-y-3">
                                        {isCommenting ? (
                                            <IssueCommentEditor
                                                onSave={handleSaveComment}
                                                onCancel={() => setIsCommenting(false)}
                                            />
                                        ) : (
                                            <div
                                                className="w-full flex flex-col justify-between border cursor-text border-slate-200 bg-slate-50 hover:border-slate-300 p-0 min-h-0 text-sm text-slate-700 transition-colors select-none rounded-none space-y-3 h-32"
                                                onClick={() => setIsCommenting(true)}
                                            >
                                                <div className="w-full p-4 text-sm text-slate-400 focus:outline-none resize-none">
                                                    Type a new comment here...
                                                </div>
                                                <div className="flex justify-end px-3 pb-3">
                                                    <button
                                                        disabled={true}
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
                                                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700 shrink-0 mt-0.5 uppercase">
                                                        {comment.userId?.name?.[0] || comment.authorName?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-900">
                                                                {comment.userId?.name || comment.authorName || 'Someone'}
                                                            </span>
                                                            <span className="text-xs text-slate-700">
                                                                •{' '}
                                                                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </span>
                                                        </div>

                                                        {/* ✅ YouTube-style collapsible comment */}
                                                        <CommentBody html={comment.content || comment.text || ''} />
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

                {/* ═══ RIGHT: SIDEBAR ═══ */}
                <aside className="w-full lg:w-72.5 bg-slate-100 shrink-0 space-y-4 p-4 border border-l-slate-200 border-t-0 border-r-0 border-b-0 text-slate-800 min-h-screen">

                    {/* Story Points */}
                    <div className="p-2">
                        <div className="flex items-center justify-start gap-4">
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-900">Points</p>
                            <input
                                type="number"
                                min={0}
                                value={pointsDraft}
                                onChange={(e) => setPointsDraft(Number(e.target.value))}
                                onBlur={handlePointsSave}
                                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                disabled={!canEditAll}
                                className="text-xs font-semibold border border-slate-200 rounded-md px-3 py-1.5 w-20 focus:outline-none focus:border-slate-400 bg-white transition-colors disabled:opacity-60"
                            />
                        </div>
                        {savingField === 'storyPoints' && (
                            <span className="text-[11px] text-slate-400 font-mono mt-1 block">Saving…</span>
                        )}
                    </div>

                    {saveError && (
                        <p className="px-2 text-[12px] text-red-600 break-words">{saveError}</p>
                    )}

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
                                    <p className="text-xs text-slate-600 truncate mt-0.5">Please assign someone</p>
                                </div>
                            </div>
                        )}

                        {canEditAll && (
                            <div className="relative">
                                <button className="w-full text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 py-2.5 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                                    <Plus size={14} /> {assigneeName ? 'Reassign' : 'Add assignee'}
                                </button>
                                <select
                                    value=""
                                    onChange={e => {
                                        if (e.target.value) {
                                            updateField({ assignee: e.target.value } as Partial<IUserStoryData>);
                                            e.target.value = '';
                                        }
                                    }}
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

                    <DetailTimelineCards createdAt={story.createdAt} updatedAt={story.updatedAt} />

                    {/* Actions */}
                    {canDelete && (
                        <div className="border-t border-slate-400 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-700 mb-3.5">Actions</p>
                            <div className="grid grid-cols-4 gap-2">
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
                            </div>
                        </div>
                    )}
                </aside>
            </div>

            {showCreateTask && (
                <CreateTaskModal
                    onClose={() => setShowCreateTask(false)}
                    storyId={storyId!}
                    onTaskCreated={handleTaskCreated}
                />
            )}
            <GlobalConfirmModal />
        </div>
    );
};

export default StoryDetailPage;