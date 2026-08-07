import { createElement, useEffect, useMemo, useState } from 'react';
import { Activity, Briefcase, Layers, Target, Users } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAppSelector } from './storeHooks';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import type {
  ActivityItem,
  IssueSummary,
  Metric,
  ProjectSummary,
  TeamMemberLoad,
} from '../types/dashboard.types';
import type { Issue } from '../types/issue';
import type { BackendProject } from '../pages/app/ProjectsPage';

export interface DashboardIssue extends Issue {
  projectId: string;
  projectName: string;
}

export interface UseDashboardDataResult {
  loading: boolean;
  error: string | null;
  projects: BackendProject[];
  issues: DashboardIssue[];
  projectSummaries: ProjectSummary[];
  activity: ActivityItem[];
  myIssues: IssueSummary[];
  teamWorkload: TeamMemberLoad[];
  metricsForOwner: Metric[];
  metricsForManager: Metric[];
  metricsForEmployee: Metric[];
  metricsForSuperadmin: Metric[];
  blockerCount: number;
  completedCount: number;
  openIssueCount: number;
}

const statusToIssueSummary = (status: string): IssueSummary['status'] => {
  if (status === 'Done') return 'done';
  if (status === 'In-Progress' || status === 'Review') return 'in-progress';
  return 'todo';
};

const issueToActivity = (issue: DashboardIssue): ActivityItem => {
  const action =
    issue.status === 'Done'
      ? 'completed'
      : issue.status === 'In-Progress'
        ? 'is working on'
        : issue.status === 'Review'
          ? 'moved to review'
          : 'updated';

  return {
    id: issue._id,
    actorName: issue.assignedTo?.name ?? issue.assignedBy?.name ?? 'Someone',
    action,
    target: `#${issue.issueKey} ${issue.title}`,
    timestamp: formatRelativeTime(issue.updatedAt ?? issue.createdAt),
    projectId: issue.projectId,
    issueId: issue._id,
  };
};

export const useDashboardData = (): UseDashboardDataResult => {
  const { user } = useAppSelector((state) => state.auth);
  const { sprints, backlogStories, storiesBySprint } = useAppSelector((state) => state.scrum);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const [issues, setIssues] = useState<DashboardIssue[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const projectRes = await axiosInstance.get('project/get');
        const projectList: BackendProject[] = projectRes.data?.projects ?? [];
        if (cancelled) return;
        setProjects(projectList);

        if (projectList.length === 0) {
          setIssues([]);
          return;
        }

        const results = await Promise.allSettled(
          projectList.map((p) => axiosInstance.get(`/issue/get_all_issue/${p._id}`))
        );

        if (cancelled) return;

        const merged: DashboardIssue[] = results.flatMap((result, index) => {
          if (result.status !== 'fulfilled') return [];
          const list: Issue[] = result.value.data?.issues ?? [];
          const project = projectList[index];
          return list.map((issue) => ({
            ...issue,
            projectId: project._id,
            projectName: project.name,
          }));
        });

        setIssues(merged);
      } catch {
        if (!cancelled) {
          setError('Unable to load dashboard data.');
          setProjects([]);
          setIssues([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  const openIssues = useMemo(
    () => issues.filter((i) => i.status !== 'Done'),
    [issues]
  );

  const blockerCount = useMemo(
    () => issues.filter((i) => i.severity === 'Critical' && i.status !== 'Done').length,
    [issues]
  );

  const completedCount = useMemo(
    () => issues.filter((i) => i.status === 'Done').length,
    [issues]
  );

  const projectSummaries = useMemo<ProjectSummary[]>(() => {
    return projects.map((p) => {
      const projectIssues = issues.filter((i) => i.projectId === p._id);
      const total = projectIssues.length;
      const done = projectIssues.filter((i) => i.status === 'Done').length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        id: p._id,
        name: p.name,
        memberCount: (p.members?.length ?? 0) + 1,
        ownerName: p.project_owner?.name ?? 'Unknown',
        progress,
      };
    });
  }, [projects, issues]);

  const activity = useMemo<ActivityItem[]>(() => {
    return [...issues]
      .sort((a, b) => {
        const ta = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
        const tb = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        return tb - ta;
      })
      .slice(0, 8)
      .map(issueToActivity);
  }, [issues]);

  const myIssues = useMemo<IssueSummary[]>(() => {
    if (!user?.id) return [];
    return issues
      .filter((i) => i.assignedTo?._id === user.id && i.status !== 'Done')
      .slice(0, 10)
      .map((i) => ({
        id: i._id,
        title: i.title,
        status: statusToIssueSummary(i.status),
        projectName: i.projectName,
        projectId: i.projectId,
        issueKey: i.issueKey,
      }));
  }, [issues, user?.id]);

  const teamWorkload = useMemo<TeamMemberLoad[]>(() => {
    const map = new Map<string, { id: string; name: string; openIssues: number; role: string }>();

    openIssues.forEach((issue) => {
      if (!issue.assignedTo?._id) return;
      const existing = map.get(issue.assignedTo._id);
      if (existing) {
        existing.openIssues += 1;
      } else {
        map.set(issue.assignedTo._id, {
          id: issue.assignedTo._id,
          name: issue.assignedTo.name,
          openIssues: 1,
          role: 'Member',
        });
      }
    });

    const rows = Array.from(map.values()).sort((a, b) => b.openIssues - a.openIssues);
    const capacity = Math.max(1, ...rows.map((r) => r.openIssues), 5);
    return rows.map((r) => ({ ...r, capacity }));
  }, [openIssues]);

  const activeSprintCount = sprints.filter((s) => s.status === 'active').length;

  const metricsForOwner = useMemo<Metric[]>(() => [
    { label: 'Active projects', value: String(projects.length), hint: 'in workspace', trend: 'neutral', icon: createElement(Briefcase, { size: 16 }) },
    { label: 'Open issues', value: String(openIssues.length), hint: `${blockerCount} blockers`, trend: 'neutral', icon: createElement(Target, { size: 16 }) },
    { label: 'Completed', value: String(completedCount), hint: 'issues resolved', trend: 'neutral', icon: createElement(Activity, { size: 16 }) },
  ], [projects.length, openIssues.length, blockerCount, completedCount]);

  const metricsForManager = useMemo<Metric[]>(() => [
    { label: 'Active sprints', value: String(activeSprintCount), hint: `${sprints.length} total`, trend: 'neutral', icon: createElement(Layers, { size: 16 }) },
    { label: 'Open issues', value: String(openIssues.length), hint: `${blockerCount} critical`, trend: 'neutral', icon: createElement(Target, { size: 16 }) },
    { label: 'Team load', value: String(teamWorkload.length), hint: 'members with work', trend: 'neutral', icon: createElement(Users, { size: 16 }) },
  ], [activeSprintCount, sprints.length, openIssues.length, blockerCount, teamWorkload.length]);

  const metricsForEmployee = useMemo<Metric[]>(() => [
    { label: 'Assigned to me', value: String(myIssues.length), hint: 'open issues', trend: 'neutral', icon: createElement(Target, { size: 16 }) },
    { label: 'My stories', value: String(
      [...(backlogStories ?? []), ...Object.values(storiesBySprint ?? {}).flat()]
        .filter((s: any) => s.assignee?._id === user?.id).length
    ), hint: 'from scrum board', trend: 'neutral', icon: createElement(Layers, { size: 16 }) },
    { label: 'Active sprints', value: String(activeSprintCount), hint: 'in workspace', trend: 'neutral', icon: createElement(Activity, { size: 16 }) },
  ], [myIssues.length, backlogStories, storiesBySprint, user?.id, activeSprintCount]);

  const metricsForSuperadmin = useMemo<Metric[]>(() => [
    { label: 'Projects', value: String(projects.length), hint: 'on platform', trend: 'neutral', icon: createElement(Briefcase, { size: 16 }) },
    { label: 'Total issues', value: String(issues.length), hint: 'tracked', trend: 'neutral', icon: createElement(Activity, { size: 16 }) },
    { label: 'Contributors', value: String(teamWorkload.length), hint: 'with assignments', trend: 'neutral', icon: createElement(Users, { size: 16 }) },
  ], [projects.length, issues.length, teamWorkload.length]);

  return {
    loading,
    error,
    projects,
    issues,
    projectSummaries,
    activity,
    myIssues,
    teamWorkload,
    metricsForOwner,
    metricsForManager,
    metricsForEmployee,
    metricsForSuperadmin,
    blockerCount,
    completedCount,
    openIssueCount: openIssues.length,
  };
};
