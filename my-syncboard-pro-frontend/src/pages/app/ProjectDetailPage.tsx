import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, FolderKanban, Users, Crown, AlertCircle,
    UserCircle, ListChecks, Layers, Inbox, Hash, CheckCircle2,
    Calendar, Clock, GitBranch, MoreHorizontal, Check, Copy,
    Search, Grid3x3, List, CircleDot, Circle, CircleCheck,
    CircleDashed, CircleAlert, TrendingUp, Activity, Target, Briefcase
} from 'lucide-react';

import axiosInstance from '../../api/axiosInstance';
import { useAppDispatch, useAppSelector } from '../../hooks/storeHooks';
import {
    setActiveProjectStart,
    setActiveProjectSuccess,
    setActiveProjectFailure,
    clearActiveProject,
    type ActiveProjectData,
} from '../../features/activeProject/activeProjectSlice';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import RoleBadge from '../../components/Invite/RoleBadge';
import type { AppRole } from '../../routes/routeConfig';
import { useAppSelector as useAuth } from '../../hooks/storeHooks';
import {
    fetchBacklogStoriesAsync,
    fetchSprintsAsync,
    fetchStoriesBySprintAsync,
    resetScrumState,
} from '../../features/activeScrum/scrumSlice';
import { useDashboardData } from '../../hooks/useDashboardData';

/* ---------------------------------- Types --------------------------------- */

interface ProjectDetailResponse {
    success: boolean;
    project: ActiveProjectData;
}

type ProjectMember = ActiveProjectData['members'][number];

interface MyStoryRow {
    _id: string;
    title: string;
    storyPoints?: number;
    sprintName: string;
    totalTasks?: number;
    doneTasks?: number;
}

interface MyTaskRow {
    _id: string;
    title: string;
    status: string;
    priority: string;
    storyTitle?: string;
    sprintName: string;
}

interface MyIssueRow {
    _id: string;
    title: string;
    issueKey?: string;
    type: string;
    severity: string;
    priority: string;
    status: string;
}

type ViewMode = 'list' | 'grid';

/* ------------------------------ Design System ------------------------------ */
/*
 * Neutral zinc scale for structure, a single indigo accent for interactive /
 * progress state (kept restrained), and the existing semantic priority /
 * status colors preserved as-is since they encode real domain meaning.
 */

const PRIORITY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
    Low: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-100' },
    Medium: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' },
    High: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-100' },
    Critical: { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-100' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    'todo': { bg: 'bg-zinc-100', text: 'text-zinc-600', icon: CircleDashed },
    'in-progress': { bg: 'bg-blue-50', text: 'text-blue-600', icon: CircleDot },
    'in review': { bg: 'bg-purple-50', text: 'text-purple-600', icon: CircleAlert },
    'done': { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CircleCheck },
    'backlog': { bg: 'bg-zinc-100', text: 'text-zinc-500', icon: Circle },
};

const CARD = 'overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300';
const CARD_HEADER = 'flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-6 py-4.5 bg-zinc-50/60';
const BADGE = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider';
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white';
const ICON_TILE = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700';
const TAB_BAR = 'flex gap-1 rounded-lg bg-zinc-50 p-1';
const SCROLL_AREA = 'flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent';
/* Shared row height for the My Work / Team Roster / Activity section so all three
   panels line up and scroll internally instead of stretching with dead space. */
const PANEL_ROW_HEIGHT = 'xl:h-[640px]';

/* --------------------------------- Helpers --------------------------------- */

const getInitials = (name?: string) =>
    (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

/* --------------------------- Shimmer Skeleton --------------------------- */

const Shimmer = ({ className = '', delay = 0 }: { className?: string; delay?: number }) => (
    <div className={`relative overflow-hidden rounded-lg bg-zinc-200/60 ${className}`}>
        <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent"
            style={{ animationDelay: `${delay}s` }}
        />
    </div>
);

const ProjectDetailSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50 px-4 py-6 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-6">
            <Shimmer className="h-5 w-24" />

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className={`${CARD} p-6 space-y-5`}>
                    <div className="flex items-start gap-4">
                        <Shimmer className="h-16 w-16 rounded-2xl" />
                        <div className="flex-1 space-y-2.5">
                            <Shimmer className="h-7 w-48" />
                            <Shimmer className="h-4 w-full" />
                            <Shimmer className="h-4 w-2/3" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-1">
                        {[0, 1, 2].map(i => <Shimmer key={i} className="h-16 w-full" delay={i * 0.1} />)}
                    </div>
                </div>
                <div className={`${CARD} p-6 space-y-4`}>
                    <Shimmer className="h-6 w-32" />
                    <div className="grid grid-cols-2 gap-3">
                        {[0, 1, 2, 3].map(i => <Shimmer key={i} className="h-16 w-full" delay={i * 0.1} />)}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <div className={`${CARD} p-6 space-y-4`}>
                    <Shimmer className="h-6 w-40" />
                    {[0, 1, 2, 3].map(i => <Shimmer key={i} className="h-16 w-full rounded-xl" delay={i * 0.08} />)}
                </div>
                <div className={`${CARD} p-6 space-y-4`}>
                    <Shimmer className="h-6 w-32" />
                    {[0, 1, 2, 3, 4].map(i => <Shimmer key={i} className="h-12 w-full rounded-xl" delay={i * 0.08} />)}
                </div>
            </div>

            <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
        </div>
    </div>
);

/* --------------------------- Empty State --------------------------- */

const EmptyState = ({ icon: Icon, text, description }: { icon: typeof Inbox; text: string; description?: string }) => (
    <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-200 text-zinc-400">
            <Icon size={22} />
        </div>
        <div className="space-y-0.5">
            <p className="text-sm font-semibold text-zinc-700">{text}</p>
            {description && <p className="text-xs text-zinc-400">{description}</p>}
        </div>
    </div>
);

/* ---------------------------- Project Header Card --------------------------- */

const ProjectHeaderCard = ({
    data,
    memberCount,
    canManageTeam,
    viewerRole,
    viewerTitle,
}: {
    data: ActiveProjectData;
    memberCount: number;
    canManageTeam: boolean;
    viewerRole?: AppRole;
    viewerTitle?: string;
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const onClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [menuOpen]);

    const shortId = data._id?.slice(-8).toUpperCase() ?? '—';

    const handleCopyId = async () => {
        try {
            await navigator.clipboard.writeText(data._id ?? '');
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch {
            /* clipboard unavailable — silently ignore */
        }
        setMenuOpen(false);
    };

    return (
        <div className={`${CARD} relative flex h-full flex-col`}>
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-400" />
            <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start gap-4">
                    <div className="group relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white shadow-lg shadow-zinc-900/10 ring-1 ring-transparent transition-all duration-300 hover:ring-indigo-300">
                        <FolderKanban size={26} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="truncate text-2xl font-bold tracking-tight text-zinc-900">
                                {data.name}
                            </h1>
                            <span className={`${BADGE} bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                            </span>
                            {!canManageTeam && (
                                <span className={`${BADGE} bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200`}>
                                    <UserCircle size={12} />
                                    Viewing as employee
                                </span>
                            )}
                        </div>

                        {/* Clamped to 3 lines so a very long description can't blow the
                            card's height out of proportion with the stats card beside it;
                            full text is still available on hover via the title tooltip. */}
                        <p
                            className="mt-2 line-clamp-3 max-w-2xl text-sm leading-relaxed text-zinc-500"
                            title={data.description || undefined}
                        >
                            {data.description || 'No description provided for this project.'}
                        </p>
                    </div>

                    {/* Quick actions menu */}
                    <div className="relative shrink-0" ref={menuRef}>
                        <button
                            type="button"
                            aria-label="Project actions"
                            onClick={() => setMenuOpen((v) => !v)}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 ${FOCUS_RING}`}
                        >
                            <MoreHorizontal size={18} />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-11 z-10 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg shadow-zinc-900/10">
                                <button
                                    type="button"
                                    onClick={handleCopyId}
                                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                                >
                                    {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} className="text-zinc-400" />}
                                    {copied ? 'Copied to clipboard' : 'Copy project ID'}
                                </button>
                                {canManageTeam && (
                                    <Link
                                        to={`/projects/${data._id}/team`}
                                        onClick={() => setMenuOpen(false)}
                                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                                    >
                                        <Users size={15} className="text-zinc-400" />
                                        Manage team
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Grid — mt-auto pins it to the card's bottom edge so extra
                    height (from a short description, once the card is stretched to
                    match the stats card beside it) collapses here instead of leaving
                    a gap between the description and this row. */}
                <div className="mt-auto grid grid-cols-1 gap-3 pt-6 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3.5 transition-colors hover:bg-white">
                        <div className={ICON_TILE}>
                            <Users size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Members</p>
                            <p className="text-sm font-semibold text-zinc-900">{memberCount}</p>
                        </div>
                    </div>

                    {canManageTeam ? (
                        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3.5 transition-colors hover:bg-white">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Crown size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Owner</p>
                                <p className="truncate text-sm font-semibold text-zinc-900">{data.project_owner?.name}</p>
                                <p className="truncate text-xs text-zinc-400">{data.project_owner?.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3.5 transition-colors hover:bg-white">
                            <div className={ICON_TILE}>
                                <UserCircle size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Your Role</p>
                                <p className="truncate text-sm font-semibold capitalize text-zinc-900">{viewerTitle || viewerRole || '—'}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3.5 transition-colors hover:bg-white">
                        <div className={ICON_TILE}>
                            <Hash size={16} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                {canManageTeam ? 'Project ID' : 'Owner Title'}
                            </p>
                            <p className="truncate text-sm font-semibold text-zinc-900">
                                {canManageTeam ? `#${shortId}` : (data.project_owner?.title || '—')}
                            </p>
                            {canManageTeam && data.project_owner?.email && (
                                <p className="truncate text-xs text-zinc-400">{data.project_owner.email}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ---------------------------- Sprint Overview Card --------------------------- */

const SprintOverviewCard = ({
    totalSprints,
    activeSprints,
    backlogCount,
    totalStories,
}: {
    totalSprints: number;
    activeSprints: number;
    backlogCount: number;
    totalStories: number;
}) => {
    const stats = [
        { value: totalSprints, label: 'Total Sprints', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
        { value: activeSprints, label: 'Active Sprints', icon: Clock, color: 'text-emerald-600 bg-emerald-50' },
        { value: totalStories, label: 'Total Stories', icon: GitBranch, color: 'text-purple-600 bg-purple-50' },
        { value: backlogCount, label: 'In Backlog', icon: Inbox, color: 'text-amber-600 bg-amber-50' },
    ];

    return (
        <div className={`${CARD} flex h-full flex-col`}>
            <div className={CARD_HEADER}>
                <div className="flex items-center gap-3">
                    <div className={ICON_TILE}>
                        <Layers size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-900">Sprint Overview</h2>
                        <p className="text-xs text-zinc-400">Scrum snapshot for this project</p>
                    </div>
                </div>
            </div>
            <div className="flex flex-1 flex-col justify-center p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-center transition-colors hover:bg-white">
                            <div className={`mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                                <stat.icon size={15} />
                            </div>
                            <p className="text-xl font-bold tabular-nums tracking-tight text-zinc-900">{stat.value}</p>
                            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ---------------------------- Employee Stats Card --------------------------- */

const EmployeeStatsCard = ({
    totalStories,
    myTasksCount,
    myIssuesCount,
    doneTasks,
}: {
    totalStories: number;
    myTasksCount: number;
    myIssuesCount: number;
    doneTasks: number;
}) => {
    const stats = [
        { value: totalStories, label: 'My Stories', icon: GitBranch, color: 'text-blue-600 bg-blue-50' },
        { value: myTasksCount, label: 'My Tasks', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
        { value: myIssuesCount, label: 'My Issues', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
        { value: doneTasks, label: 'Tasks Done', icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
    ];

    return (
        <div className={`${CARD} flex h-full flex-col`}>
            <div className={CARD_HEADER}>
                <div className="flex items-center gap-3">
                    <div className={ICON_TILE}>
                        <Target size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-900">Your Progress</h2>
                        <p className="text-xs text-zinc-400">Work assigned to you</p>
                    </div>
                </div>
            </div>
            <div className="flex flex-1 flex-col justify-center p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-center transition-colors hover:bg-white">
                            <div className={`mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                                <stat.icon size={15} />
                            </div>
                            <p className="text-xl font-bold tabular-nums tracking-tight text-zinc-900">{stat.value}</p>
                            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ---------------------------- My Work Panel --------------------------- */

type WorkTab = 'stories' | 'tasks' | 'issues';

const MyWorkPanel = ({
    stories,
    tasks,
    issues,
    loading,
    projectId,
}: {
    stories: MyStoryRow[];
    tasks: MyTaskRow[];
    issues: MyIssueRow[];
    loading: boolean;
    projectId?: string;
}) => {
    const navigate = useNavigate();
    const [tab, setTab] = useState<WorkTab>('stories');
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    const tabs: { key: WorkTab; label: string; count: number; icon: React.ElementType }[] = [
        { key: 'stories', label: 'Stories', count: stories.length, icon: GitBranch },
        { key: 'tasks', label: 'Tasks', count: tasks.length, icon: CheckCircle2 },
        { key: 'issues', label: 'Issues', count: issues.length, icon: AlertCircle },
    ];

    const changeTab = (key: WorkTab) => {
        setTab(key);
        setStatusFilter('all');
    };

    const q = query.trim().toLowerCase();

    const filteredStories = useMemo(
        () => stories.filter((s) => s.title?.toLowerCase().includes(q)),
        [stories, q]
    );
    const taskStatuses = useMemo(() => Array.from(new Set(tasks.map((t) => t.status).filter(Boolean))), [tasks]);
    const filteredTasks = useMemo(
        () => tasks.filter((t) =>
            t.title?.toLowerCase().includes(q) && (statusFilter === 'all' || t.status === statusFilter)
        ),
        [tasks, q, statusFilter]
    );
    const issueStatuses = useMemo(() => Array.from(new Set(issues.map((i) => i.status).filter(Boolean))), [issues]);
    const filteredIssues = useMemo(
        () => issues.filter((i) =>
            i.title?.toLowerCase().includes(q) && (statusFilter === 'all' || i.status === statusFilter)
        ),
        [issues, q, statusFilter]
    );

    // Grid view: plain grid, no auto-rows-fr. Grid's default align-items:stretch
    // already equalizes card heights *within a single row* to that row's tallest
    // card — auto-rows-fr instead stretches every row to fill the whole scroll
    // container divided by row count, which caused big empty gaps when a tab
    // had few items (e.g. only 4 issues = 2 rows, each row grabbing half the
    // panel's height regardless of how little content it held).
    const listClass = viewMode === 'grid'
        ? `grid grid-cols-1 sm:grid-cols-2 content-start gap-2.5 pr-1 ${SCROLL_AREA}`
        : `space-y-2.5 pr-1 ${SCROLL_AREA}`;

    // h-full only makes sense in grid mode, where it lets a card fill its grid
    // row (matching the row's tallest sibling). In list mode the wrapper is a
    // plain stacked column, not a grid row — h-full there would size each card
    // to the *entire* scroll panel's height instead of its own content.
    const cardBase = `group flex ${viewMode === 'grid' ? 'h-full' : ''} min-w-0 cursor-pointer flex-col rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-200 hover:border-zinc-300 hover:shadow-md ${FOCUS_RING}`;

    const renderStoryItem = (s: MyStoryRow) => {
        const total = s.totalTasks ?? 0;
        const done = s.doneTasks ?? 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        return (
            <div
                key={s._id}
                className={cardBase}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/projects/${projectId}/story/${s._id}`)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/projects/${projectId}/story/${s._id}`);
                    }
                }}
            >
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 text-sm font-semibold text-zinc-700">
                        {s.title?.trim()?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900" title={s.title}>
                            {s.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {typeof s.storyPoints === 'number' && (
                                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
                                    {s.storyPoints} pts
                                </span>
                            )}
                            <span className="min-w-0 truncate text-xs text-zinc-400" title={s.sprintName || '—'}>
                                Sprint: {s.sprintName || '—'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mt-3 flex min-w-0 items-center gap-3 pl-12">
                    {total > 0 ? (
                        <>
                            <div className="h-1.5 min-w-0 max-w-32 flex-1 overflow-hidden rounded-full bg-zinc-200">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="shrink-0 text-[10px] font-medium text-zinc-500">
                                {done}/{total} done
                            </span>
                        </>
                    ) : (
                        <span className="text-[10px] text-zinc-400">No tasks yet</span>
                    )}
                </div>
            </div>
        );
    };

    const renderTaskItem = (t: MyTaskRow) => {
        const priority = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.Low;
        const StatusIcon = STATUS_COLORS[t.status?.toLowerCase()]?.icon || Circle;

        return (
            <div
                key={t._id}
                className={cardBase}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/projects/${projectId}/task/${t._id}`)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/projects/${projectId}/task/${t._id}`);
                    }
                }}
            >
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                        <StatusIcon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-900" title={t.title}>
                            {t.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${priority.bg} ${priority.text} ${priority.ring}`}>
                                {t.priority}
                            </span>
                            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-medium text-zinc-600">
                                {t.status}
                            </span>
                        </div>
                        {t.storyTitle && (
                            <p className="mt-1 truncate text-xs text-zinc-400" title={t.storyTitle}>
                                Story: {t.storyTitle}
                            </p>
                        )}
                        {t.sprintName && (
                            <p className="truncate text-xs text-zinc-400" title={t.sprintName}>Sprint: {t.sprintName}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderIssueItem = (i: MyIssueRow) => {
        const priority = PRIORITY_COLORS[i.priority] || PRIORITY_COLORS.Low;

        return (
            <div
                key={i._id}
                className={cardBase}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/project/${projectId}/issue/${i._id}`)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/project/${projectId}/issue/${i._id}`);
                    }
                }}
            >
                <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${priority.bg} ${priority.text}`}>
                        <AlertCircle size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-baseline gap-1.5">
                            {i.issueKey && (
                                <span className="shrink-0 font-mono text-xs text-zinc-400">#{i.issueKey}</span>
                            )}
                            <p className="min-w-0 truncate font-medium text-zinc-900" title={i.title}>
                                {i.title}
                            </p>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${priority.bg} ${priority.text} ${priority.ring}`}>
                                {i.priority}
                            </span>
                            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-medium text-zinc-600">
                                {i.status}
                            </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-zinc-400">
                            Type: {i.type} · Severity: {i.severity}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const activeStatuses = tab === 'tasks' ? taskStatuses : tab === 'issues' ? issueStatuses : [];

    return (
        <div className={`${CARD} flex ${PANEL_ROW_HEIGHT} flex-col`}>
            <div className={CARD_HEADER}>
                <div className="flex items-center gap-3">
                    <div className={ICON_TILE}>
                        <ListChecks size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-900">My Work</h2>
                        <p className="text-xs text-zinc-400">Everything assigned to you</p>
                    </div>
                </div>
                <div className={TAB_BAR}>
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => changeTab(t.key)}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${FOCUS_RING} ${tab === t.key
                                ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-300'
                                : 'text-zinc-500 hover:text-zinc-800'
                                }`}
                        >
                            <t.icon size={12} />
                            {t.label}
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-mono ${tab === t.key ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'
                                }`}>
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Toolbar: search, status filter, view toggle */}
            <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-zinc-100 px-5 py-3">
                <div className="relative min-w-[180px] flex-1">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`Search ${tab}...`}
                        className={`w-full rounded-lg border border-zinc-200 bg-zinc-50/60 py-2 pl-9 pr-3 text-xs text-zinc-700 placeholder:text-zinc-400 transition-colors focus:bg-white ${FOCUS_RING}`}
                    />
                </div>

                {activeStatuses.length > 0 && (
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`max-w-[9.5rem] rounded-lg border border-zinc-200 bg-zinc-50/60 py-2 pl-2.5 pr-7 text-xs font-medium text-zinc-600 transition-colors focus:bg-white ${FOCUS_RING}`}
                    >
                        <option value="all">All statuses</option>
                        {activeStatuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                )}

                <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50/60 p-1">
                    <button
                        type="button"
                        aria-label="List view"
                        onClick={() => setViewMode('list')}
                        className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${FOCUS_RING} ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-700'}`}
                    >
                        <List size={13} />
                    </button>
                    <button
                        type="button"
                        aria-label="Grid view"
                        onClick={() => setViewMode('grid')}
                        className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${FOCUS_RING} ${viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-700'}`}
                    >
                        <Grid3x3 size={13} />
                    </button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-5">
                {loading ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map(i => (
                            <Shimmer key={i} className="h-20 w-full rounded-xl" delay={i * 0.08} />
                        ))}
                    </div>
                ) : tab === 'stories' ? (
                    filteredStories.length === 0 ? (
                        <EmptyState
                            icon={Inbox}
                            text={stories.length === 0 ? 'No stories assigned' : 'No matches'}
                            description={stories.length === 0 ? "You haven't been assigned any stories yet." : 'Try a different search term.'}
                        />
                    ) : (
                        <div className={listClass}>{filteredStories.map(renderStoryItem)}</div>
                    )
                ) : tab === 'tasks' ? (
                    filteredTasks.length === 0 ? (
                        <EmptyState
                            icon={Inbox}
                            text={tasks.length === 0 ? 'No tasks assigned' : 'No matches'}
                            description={tasks.length === 0 ? "You haven't been assigned any tasks yet." : 'Try adjusting your search or filter.'}
                        />
                    ) : (
                        <div className={listClass}>{filteredTasks.map(renderTaskItem)}</div>
                    )
                ) : filteredIssues.length === 0 ? (
                    <EmptyState
                        icon={Inbox}
                        text={issues.length === 0 ? 'No issues assigned' : 'No matches'}
                        description={issues.length === 0 ? "You haven't been assigned any issues yet." : 'Try adjusting your search or filter.'}
                    />
                ) : (
                    <div className={listClass}>{filteredIssues.map(renderIssueItem)}</div>
                )}
            </div>
        </div>
    );
};

/* ---------------------------- Team Roster Card --------------------------- */

const TeamRosterCard = ({
    members,
    projectOwnerId,
    projectId,
    canManageTeam,
    className = '',
}: {
    members: ProjectMember[];
    projectOwnerId?: string;
    projectId?: string;
    canManageTeam: boolean;
    className?: string;
}) => {
    const [query, setQuery] = useState('');

    const counts = members.reduce<Record<string, number>>((acc, m) => {
        if (m._id === projectOwnerId) return acc;
        const role = m.role ?? 'employee';
        acc[role] = (acc[role] ?? 0) + 1;
        return acc;
    }, {});

    const roleStats = [
        { value: projectOwnerId ? 1 : 0, label: 'Owner', icon: Crown, color: 'text-amber-600' },
        { value: counts.manager ?? 0, label: 'Managers', icon: UserCircle, color: 'text-blue-600' },
        { value: counts.employee ?? 0, label: 'Employees', icon: Users, color: 'text-zinc-500' },
    ];

    const q = query.trim().toLowerCase();
    const filteredMembers = q
        ? members.filter((m) => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q))
        : members;

    return (
        <div className={`${CARD} flex flex-col ${className}`}>
            <div className={CARD_HEADER}>
                <div className="flex items-center gap-3">
                    <div className={ICON_TILE}>
                        <Users size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-900">Team Roster</h2>
                        <p className="text-xs text-zinc-400">{members.length} members assigned</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Compact role breakdown — keeps the header informative without a separate stats row */}
                    <div className="hidden items-center gap-1 rounded-lg border border-zinc-200 bg-white px-1 py-1 sm:flex">
                        {roleStats.map((stat) => (
                            <span
                                key={stat.label}
                                title={stat.label}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-600"
                            >
                                <stat.icon size={11} className={stat.color} />
                                {stat.value}
                            </span>
                        ))}
                    </div>
                    {canManageTeam && (
                        <Link
                            to={`/projects/${projectId}/team`}
                            className={`inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 ${FOCUS_RING}`}
                        >
                            <UserCircle size={14} />
                            Manage Team
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-5">
                <div className="relative mb-3 shrink-0">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search members..."
                        className={`w-full rounded-lg border border-zinc-200 bg-zinc-50/60 py-2 pl-9 pr-3 text-xs text-zinc-700 placeholder:text-zinc-400 transition-colors focus:bg-white ${FOCUS_RING}`}
                    />
                </div>

                <div className={`space-y-2 pr-1 ${SCROLL_AREA}`}>
                    {filteredMembers.length ? (
                        filteredMembers.map((m) => {
                            const isOwner = m._id === projectOwnerId;
                            return (
                                <div key={m._id} className="flex min-w-0 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2 transition-all duration-200 hover:border-zinc-300 hover:shadow-sm">
                                    <div className="relative shrink-0">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-semibold text-zinc-700">
                                            {getInitials(m.name)}
                                        </div>
                                        {isOwner && (
                                            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-amber-500 shadow-sm">
                                                <Crown size={7} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <p className="min-w-0 truncate text-sm font-medium text-zinc-900" title={m.name}>
                                                {m.name}
                                            </p>
                                            {isOwner && (
                                                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                                                    Owner
                                                </span>
                                            )}
                                        </div>
                                        <p className="truncate text-xs text-zinc-400" title={m.email}>
                                            {m.email}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {m.title && (
                                            <span
                                                className="hidden max-w-[7rem] truncate rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-zinc-600 sm:inline-block"
                                                title={m.title}
                                            >
                                                {m.title}
                                            </span>
                                        )}
                                        <RoleBadge role={(m.role ?? 'employee') as AppRole} />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <EmptyState
                            icon={Users}
                            text={members.length === 0 ? 'No members' : 'No matches'}
                            description={members.length === 0 ? 'This project has no members yet.' : 'Try a different search term.'}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

/* ---------------------------- Activity Feed Card --------------------------- */

const ActivityFeedCard = ({ items, className = '' }: { items: any[]; className?: string }) => {
    return ( 
             
            <div className={` ${SCROLL_AREA}`}>
                <ActivityFeed items={items} />
            </div>
       
    );
};

/* ------------------------------------ Page ------------------------------------ */

const ProjectDetailPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const dispatch = useAppDispatch();

    const { data, loading, error } = useAppSelector((s) => s.activeProject);
    const activeProjectId = data?._id;
    const { user } = useAuth((s) => s.auth);
    const { activity: dashboardActivity } = useDashboardData();
    const { sprints, backlogStories, storiesBySprint } = useAppSelector((s) => s.scrum);

    const viewerRole = user?.role as AppRole | undefined;
    const canManageTeam = viewerRole === 'owner' || viewerRole === 'manager';

    const [myTasks, setMyTasks] = useState<MyTaskRow[]>([]);
    const [myIssues, setMyIssues] = useState<MyIssueRow[]>([]);
    const [workLoading, setWorkLoading] = useState(false);

    /* fetch project */
    useEffect(() => {
        if (!projectId) {
            dispatch(clearActiveProject());
            return;
        }

        (async () => {
            dispatch(setActiveProjectStart());
            try {
                const res = await axiosInstance.get<ProjectDetailResponse>(`/project/${projectId}`);
                if (res.data?.project) {
                    dispatch(setActiveProjectSuccess(res.data.project));
                } else {
                    dispatch(setActiveProjectFailure('Project data was not returned by the server.'));
                }
            } catch (err: any) {
                dispatch(setActiveProjectFailure(err?.response?.data?.message || 'Unable to load project details.'));
            }
        })();

        return () => { dispatch(clearActiveProject()); };
    }, [dispatch, projectId]);

    /* fetch scrum data */
    useEffect(() => {
        if (!activeProjectId) {
            dispatch(resetScrumState());
            return;
        }

        dispatch(resetScrumState());
        dispatch(fetchBacklogStoriesAsync(activeProjectId));
        dispatch(fetchSprintsAsync(activeProjectId)).then((res) => {
            if (res.meta.requestStatus === 'fulfilled' && Array.isArray(res.payload)) {
                res.payload.forEach((sprint) => dispatch(fetchStoriesBySprintAsync(sprint._id)));
            }
        });
    }, [activeProjectId, dispatch]);

    /* fetch employee's assigned tasks + issues */
    useEffect(() => {
        if (!activeProjectId || !user?.id || canManageTeam) {
            setMyTasks([]);
            setMyIssues([]);
            return;
        }

        let cancelled = false;

        (async () => {
            setWorkLoading(true);
            try {
                const issuesRes = await axiosInstance.get(`/issue/get_all_issue/${activeProjectId}`);
                const allIssues = issuesRes.data?.issues ?? [];
                const mineIssues: MyIssueRow[] = allIssues
                    .filter((i: any) => i.assignedTo?._id === user.id)
                    .map((i: any) => ({
                        _id: i._id,
                        title: i.title,
                        issueKey: i.issueKey,
                        type: i.type,
                        severity: i.severity,
                        priority: i.priority,
                        status: i.status,
                    }));

                const sprintList = sprints ?? [];
                const backlogList = backlogStories ?? [];

                const taskRequests = [
                    ...sprintList.map((sp: any) =>
                        axiosInstance
                            .get(`/task/get_by_sprint/${sp._id}`)
                            .then((r) => ({ list: r.data ?? [], sprintName: sp.name }))
                            .catch(() => ({ list: [], sprintName: sp.name }))
                    ),
                    ...backlogList.map((st: any) =>
                        axiosInstance
                            .get(`/task/get_by_story/${st._id}`)
                            .then((r) => ({ list: r.data ?? [], sprintName: 'Backlog' }))
                            .catch(() => ({ list: [], sprintName: 'Backlog' }))
                    ),
                ];

                const taskResults = await Promise.all(taskRequests);
                const mineTasks: MyTaskRow[] = taskResults.flatMap(({ list, sprintName }) =>
                    (list ?? [])
                        .filter((t: any) => t.assignedTo?._id === user.id)
                        .map((t: any) => ({
                            _id: t._id,
                            title: t.title,
                            status: t.status,
                            priority: t.priority,
                            storyTitle: t.storyId?.title,
                            sprintName,
                        }))
                );

                if (!cancelled) {
                    setMyIssues(mineIssues);
                    setMyTasks(mineTasks);
                }
            } catch {
                if (!cancelled) {
                    setMyIssues([]);
                    setMyTasks([]);
                }
            } finally {
                if (!cancelled) setWorkLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [activeProjectId, user?.id, canManageTeam, sprints, backlogStories]);

    const sprintStats = useMemo(() => {
        const totalStories =
            (backlogStories?.length ?? 0) +
            Object.values(storiesBySprint ?? {}).reduce((sum, list) => sum + (list?.length ?? 0), 0);

        return {
            totalSprints: sprints?.length ?? 0,
            activeSprints: sprints?.filter((s) => s.status === 'active').length ?? 0,
            backlogCount: backlogStories?.length ?? 0,
            totalStories,
        };
    }, [sprints, backlogStories, storiesBySprint]);

    const myStories = useMemo<MyStoryRow[]>(() => {
        if (!user?.id) return [];

        const fromList = (list: any[] | undefined, sprintName: string) =>
            (list ?? [])
                .filter((s) => s.assignee?._id === user.id)
                .map((s) => ({
                    _id: s._id,
                    title: s.title,
                    storyPoints: s.storyPoints,
                    sprintName,
                    totalTasks: s.totalTasks,
                    doneTasks: s.doneTasks,
                }));

        const backlogRows = fromList(backlogStories, 'Backlog');
        const sprintRows = Object.entries(storiesBySprint ?? {}).flatMap(([sprintId, list]) =>
            fromList(list, sprints?.find((sp) => sp._id === sprintId)?.name ?? 'Sprint')
        );

        return [...backlogRows, ...sprintRows];
    }, [user?.id, backlogStories, storiesBySprint, sprints]);

    const employeeStats = useMemo(() => {
        const totalStories = myStories.length;
        const doneTasks = myStories.reduce((sum, s) => sum + (s.doneTasks ?? 0), 0);
        return {
            totalStories,
            doneTasks,
            myTasksCount: myTasks.length,
            myIssuesCount: myIssues.length,
        };
    }, [myStories, myTasks, myIssues]);

    /* loading / error / empty states */
    if (loading) {
        return <ProjectDetailSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50 px-4 py-6 sm:px-8 lg:px-16">
                <div className="mx-auto max-w-7xl">
                    <div className={CARD}>
                        <div className="p-8 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                                <AlertCircle size={28} />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-900">Unable to load project</h3>
                            <p className="mt-1 text-sm text-zinc-500">{error}</p>
                            <Link
                                to="/projects"
                                className={`mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 ${FOCUS_RING}`}
                            >
                                <ArrowLeft size={16} />
                                Back to projects
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50 px-4 py-6 sm:px-8 lg:px-16">
                <div className="mx-auto max-w-7xl">
                    <div className={CARD}>
                        <div className="p-8 text-center">
                            <p className="text-sm text-zinc-500">Project data is not available.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* derive member list */
    const ownerInMembers = data.members?.some((m) => m._id === data.project_owner?._id);
    const allMembers: ProjectMember[] = ownerInMembers
        ? (data.members ?? [])
        : [
            {
                _id: data.project_owner?._id ?? '',
                name: data.project_owner?.name ?? '',
                email: data.project_owner?.email ?? '',
                role: data.project_owner?.role ?? 'owner',
                title: data.project_owner?.title,
                department: data.project_owner?.department,
            },
            ...(data.members ?? []),
        ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50/50 px-4 py-6 sm:px-8 lg:px-16">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Back button */}
                <Link
                    to="/projects"
                    className={`group inline-flex items-center gap-2 rounded-md text-sm text-zinc-500 transition-colors hover:text-zinc-900 ${FOCUS_RING}`}
                >
                    <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
                    Back to projects
                </Link>

                {/* Top row: Project Header + Stats — items-stretch so both cards
                    share the row's tallest height regardless of description length */}
                <div className="grid items-stretch gap-6 xl:grid-cols-[1.4fr_1fr]">
                    <ProjectHeaderCard
                        data={data}
                        memberCount={allMembers.length}
                        canManageTeam={canManageTeam}
                        viewerRole={viewerRole}
                        viewerTitle={user?.title}
                    />
                    {canManageTeam ? (
                        <SprintOverviewCard {...sprintStats} />
                    ) : (
                        <EmployeeStatsCard {...employeeStats} />
                    )}
                </div>

                {/* Bottom row: My Work / Team Roster + Activity — all three panels share one
                    row height on desktop and scroll internally so no space goes unused. */}
                <div className={`grid gap-6 ${PANEL_ROW_HEIGHT} xl:grid-cols-[1.4fr_1fr]`}>
                    {canManageTeam ? (
                        <>
                            <TeamRosterCard
                                members={allMembers}
                                projectOwnerId={data.project_owner?._id}
                                projectId={projectId}
                                canManageTeam={canManageTeam}
                            />
                            <ActivityFeedCard items={dashboardActivity} />
                            
                        </>
                    ) : (
                        <>
                            <MyWorkPanel
                                stories={myStories}
                                tasks={myTasks}
                                issues={myIssues}
                                loading={workLoading}
                                projectId={projectId}
                            />
                            <div className="flex min-h-0 flex-col gap-6 xl:h-full">
                                <TeamRosterCard
                                    members={allMembers}
                                    projectOwnerId={data.project_owner?._id}
                                    projectId={projectId}
                                    canManageTeam={canManageTeam}
                                    className="flex-1 min-h-0"
                                />
                                <ActivityFeedCard items={dashboardActivity} className="flex-1 min-h-0" />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailPage;