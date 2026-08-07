import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, FolderKanban, Users, Crown, AlertCircle,
    UserCircle, ListChecks, Layers, Inbox, Hash,
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

/* --------------------------------- Helpers --------------------------------- */

const getInitials = (name?: string) =>
    (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const SCROLL_LIST =
    'max-h-[400px] min-h-0 overflow-y-auto pr-1 ' +
    '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent ' +
    '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200 ' +
    'hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400';

const CARD =
    'rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] ' +
    'transition-shadow duration-300';
const LABEL = 'font-mono text-[10px] uppercase tracking-wider text-zinc-500';

/* --------------------------------- Skeleton -------------------------------- */

const ProjectDetailSkeleton = () => (
    <div className="space-y-6">
        <div className="h-5 w-24 animate-pulse rounded-md bg-zinc-100" />
        <div className={`${CARD} space-y-4 overflow-hidden p-6`}>
            <div className="relative h-6 w-48 overflow-hidden rounded-md bg-zinc-100">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            </div>
            <div className="relative h-4 w-full overflow-hidden rounded-md bg-zinc-100">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            </div>
            <div className="relative h-4 w-2/3 overflow-hidden rounded-md bg-zinc-100">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            </div>
            <div className="grid gap-4 pt-2 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="relative h-16 overflow-hidden rounded-xl bg-zinc-100">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" style={{ animationDelay: `${i * 0.12}s` }} />
                    </div>
                ))}
            </div>
        </div>
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
        <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
);

/* ------------------------------- Empty state -------------------------------- */

const EmptyState = ({ icon: Icon, text }: { icon: typeof Inbox; text: string }) => (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm">
            <Icon size={18} />
        </div>
        <p className="max-w-[220px] text-sm text-zinc-500">{text}</p>
    </div>
);

/* ------------------------------ Stat pill (header) -------------------------- */

const HeaderStat = ({
    icon: Icon,
    label,
    value,
    sub,
    accent = false,
}: {
    icon: typeof Users;
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    accent?: boolean;
}) => (
    <div className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 transition-colors duration-200 hover:bg-zinc-50">
        <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-sm transition-transform duration-200 group-hover:scale-105 ${accent
                ? 'border-amber-500/30 bg-gradient-to-br from-amber-400/15 to-amber-500/5 text-amber-600'
                : 'border-zinc-200 bg-gradient-to-br from-white to-zinc-50 text-zinc-950'
                }`}
        >
            <Icon size={16} />
        </div>
        <div className="min-w-0">
            <p className={LABEL}>{label}</p>
            <p className="truncate text-sm font-semibold capitalize text-zinc-950">{value}</p>
            {sub && <p className="truncate text-xs text-zinc-500">{sub}</p>}
        </div>
    </div>
);

/* --------------------------- Merged project header --------------------------- */

const ProjectHeader = ({
    data,
    memberCount,
    canManageTeam,
    isEmployee,
    viewerRole,
    viewerTitle,
}: {
    data: ActiveProjectData;
    memberCount: number;
    canManageTeam: boolean;
    isEmployee: boolean;
    viewerRole?: AppRole;
    viewerTitle?: string;
}) => (
    <div className={`${CARD} relative overflow-hidden p-6`}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-zinc-100 to-transparent blur-2xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 text-zinc-950 shadow-sm">
                    <FolderKanban size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-semibold capitalize tracking-tight text-zinc-950">{data.name}</h1>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                        </span>
                        {isEmployee && (
                            <span className={`rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 ${LABEL}`}>
                                Viewing as employee
                            </span>
                        )}
                    </div>
                    <p className="max-w-xl text-sm leading-relaxed text-zinc-600">
                        {data.description || 'No description provided for this project.'}
                    </p>
                </div>
            </div>
        </div>

        {/* stat row */}
        <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <HeaderStat icon={Users} label="Total members" value={memberCount} sub="on this project" />

            {canManageTeam ? (
                <HeaderStat
                    icon={Crown}
                    label="Project owner"
                    value={data.project_owner?.name}
                    sub={data.project_owner?.email}
                    accent
                />
            ) : (
                <HeaderStat
                    icon={UserCircle}
                    label="Your role"
                    value={viewerTitle ?? viewerRole ?? '—'}
                    sub={viewerRole}
                />
            )}

            <HeaderStat
                icon={Hash}
                label={canManageTeam ? 'Project ID' : 'Owner title'}
                value={canManageTeam ? (data._id?.slice(-8).toUpperCase() ?? '—') : (data.project_owner?.title ?? '—')}
                sub={canManageTeam ? data.project_owner?.email : data.project_owner?.role}
            />
        </div>
    </div>
);

/* ---------------------------------- Member card ------------------------------ */

const MemberCard = ({ member, isOwner }: { member: ProjectMember; isOwner: boolean }) => (
    <div className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-md">
        <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-gradient-to-br from-zinc-100 to-white text-xs font-semibold text-zinc-950 shadow-sm">
                {getInitials(member.name)}
            </div>
            {isOwner && (
                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm">
                    <Crown size={8} className="text-white" />
                </div>
            )}
        </div>

        <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium capitalize text-zinc-950">{member.name}</p>
                {isOwner && <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-amber-500">Owner</span>}
            </div>
            <p className="truncate break-all text-xs text-zinc-500">{member.email}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
            {member.department && <span className={`hidden sm:block ${LABEL}`}>{member.department}</span>}
            {member.title && (
                <span className="hidden rounded-full border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-700 md:block">
                    {member.title}
                </span>
            )}
            <RoleBadge role={(member.role ?? 'employee') as AppRole} />
        </div>
    </div>
);

/* --------------------------------- Role breakdown ----------------------------- */

const RoleBreakdown = ({ members, projectOwnerId }: { members: ProjectMember[]; projectOwnerId?: string }) => {
    const counts = members.reduce<Record<string, number>>((acc, m) => {
        if (m._id === projectOwnerId) return acc;
        const role = m.role ?? 'employee';
        acc[role] = (acc[role] ?? 0) + 1;
        return acc;
    }, {});

    const cells = [
        { value: projectOwnerId ? 1 : 0, label: 'Owner' },
        { value: counts.manager ?? 0, label: 'Manager' },
        { value: counts.employee ?? 0, label: 'Employee' },
    ];

    return (
        <div className="grid grid-cols-3 divide-x divide-zinc-200 rounded-xl border border-zinc-200 bg-gradient-to-b from-zinc-50 to-zinc-50/50">
            {cells.map((c) => (
                <div key={c.label} className="flex flex-col items-center gap-1 py-4 transition-colors duration-200 hover:bg-white/60">
                    <span className="text-xl font-semibold tracking-tight text-zinc-950">{c.value}</span>
                    <span className={LABEL}>{c.label}</span>
                </div>
            ))}
        </div>
    );
};

/* ------------------------------ Sprint overview strip -------------------------- */

 
const SprintOverviewStrip = ({
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
        { value: totalSprints, label: 'Total sprints' },
        { value: activeSprints, label: 'Active sprints' },
        { value: totalStories, label: 'Total stories' },
        { value: backlogCount, label: 'In backlog' },
    ];

    return (
        // Outer Card Container (Aap chaho toh yahan apna `${CARD}` variable bhi laga sakte ho)
        <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] transition-shadow duration-300 relative overflow-hidden p-6 ">
            
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 shadow-sm">
                    <Layers size={18} />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base font-semibold tracking-tight text-zinc-950">Sprint overview</h2>
                    <p className="mt-0.5 text-xs text-zinc-500">Scrum snapshot for this project</p>
                </div>
            </div>

            {/* Stats Row - No Boxes, Just Clean Dividers */}
            <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:divide-x sm:divide-zinc-200">
                {stats.map((item, index) => (
                    <div 
                        key={item.label} 
                        className={`mt-4 flex flex-col ${
                            // Pehle item me left padding na ho, baaki sab me padding ho
                            index === 0 ? 'sm:pr-5' : 'sm:px-5' 
                        }`}
                    >
                        <p className="text-xl font-semibold tracking-tight text-zinc-950">
                            {item.value}
                        </p>
                        <p className="mt-1 font-mono text-[12px] uppercase tracking-wide text-zinc-500">
                            {item.label}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
 

/* ---------------------------------- My work strip ------------------------------ */

const MyWorkStrip = ({ stories }: { stories: MyStoryRow[] }) => (
    <div className={`${CARD} p-5`}>
        <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 text-zinc-950 shadow-sm">
                <ListChecks size={16} />
            </div>
            <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-zinc-950">My work</h2>
                <p className="text-xs text-zinc-500">
                    {stories.length} stor{stories.length === 1 ? 'y' : 'ies'} assigned to you
                </p>
            </div>
        </div>

        {stories.length === 0 ? (
            <EmptyState icon={Inbox} text="Nothing assigned to you yet." />
        ) : (
            <div className={`grid gap-2 sm:grid-cols-2 ${SCROLL_LIST}`}>
                {stories.map((s) => (
                    <div key={s._id} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-md">
                        <div className="flex min-w-0 items-center justify-between gap-4">
                            <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-950">{s.title}</p>
                            {typeof s.storyPoints === 'number' && (
                                <span className="shrink-0 rounded-full border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-700">
                                    {s.storyPoints} pt{s.storyPoints === 1 ? '' : 's'}
                                </span>
                            )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={LABEL}>{s.sprintName}</span>
                            {typeof s.totalTasks === 'number' && s.totalTasks > 0 && (
                                <span className="font-mono text-[10px] text-zinc-400">
                                    · {s.doneTasks ?? 0}/{s.totalTasks} tasks done
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

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
    const isEmployee = viewerRole === 'employee';

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

    /* ---- loading / error / empty states ---- */

    if (loading) {
        return (
            <div className="min-h-0 w-full bg-white px-4 py-6 sm:px-10 lg:px-20">
                <ProjectDetailSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-0 w-full bg-white px-4 py-6 sm:px-10 lg:px-20">
                <div className={`${CARD} p-6`}>
                    <div className="mb-2 flex items-center gap-2 text-base font-semibold text-zinc-950">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <AlertCircle size={15} />
                        </span>
                        Unable to load project
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-zinc-700">{error}</p>
                    <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950">
                        <ArrowLeft size={16} />
                        Back to projects
                    </Link>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-0 w-full bg-white px-4 py-6 sm:px-10 lg:px-20">
                <div className={`${CARD} p-6`}>
                    <p className="text-sm leading-relaxed text-zinc-700">Project data is not available.</p>
                </div>
            </div>
        );
    }

    /* ---- derive member list (ensure owner is included) ---- */

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
        <div className="min-h-0 w-full bg-gradient-to-b from-zinc-50/50 to-white px-4 py-6 sm:px-10 lg:px-20">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">

                <Link to="/projects" className="inline-flex w-fit items-center gap-2 text-sm text-zinc-700 transition-colors hover:text-zinc-950">
                    <ArrowLeft size={16} />
                    Back to projects
                </Link>

                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                    <ProjectHeader
                        data={data}
                        memberCount={allMembers.length}
                        canManageTeam={canManageTeam}
                        isEmployee={isEmployee}
                        viewerRole={viewerRole}
                        viewerTitle={user?.title}
                    />
                    {canManageTeam ? (
                        <SprintOverviewStrip {...sprintStats} />
                    ) : (
                        <MyWorkStrip stories={myStories} />
                    )}
                </div>

               <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">

    {/* Team Roster Card with Fixed Height */}
    <div className={`${CARD} flex flex-col h-[600px] p-5 space-y-4`}>
        <div className="flex items-center justify-between gap-4 shrink-0">
            <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-zinc-950">Team roster</h2>
                <p className="text-xs text-zinc-500">
                    {allMembers.length} member{allMembers.length !== 1 ? 's' : ''} assigned
                </p>
            </div>
            {canManageTeam && (
                <Link
                    to={`/projects/${projectId}/team`}
                    className="flex shrink-0 items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-md"
                >
                    <UserCircle size={16} />
                    Manage team
                </Link>
            )}
        </div>

        <div className="shrink-0">
            <RoleBreakdown members={allMembers} projectOwnerId={data.project_owner?._id} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400 pt-2">
            {allMembers.length ? (
                allMembers.map((m) => (
                    <MemberCard key={m._id} member={m} isOwner={m._id === data.project_owner?._id} />
                ))
            ) : (
                <EmptyState icon={Users} text="No members assigned yet." />
            )}
        </div>
    </div>

    {/* Activity Feed Column */}
    <div className="flex min-w-0 flex-col">
        <ActivityFeed items={dashboardActivity} />
    </div>
</div>
            </div>
        </div>
    );
};

export default ProjectDetailPage;