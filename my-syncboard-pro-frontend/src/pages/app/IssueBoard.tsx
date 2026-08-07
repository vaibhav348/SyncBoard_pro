import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import IssueTopBar, { type FilterGroup } from '../../components/Issue/IssueTopBar';
import IssueTable from '../../components/IssueTable';
import { useAppSelector } from '../../hooks/storeHooks';
import CreateIssuePage from './CreateIssuePage';
import axiosInstance from '../../api/axiosInstance';
import AddMembersToIssue from '../../components/Issue/AddMembersToIssue';
import type { Issue } from '../../types/issue';

const lightMode = {
  '--color-bg': '#ffffff',
  '--color-text': '#27272a',
  '--color-text-h': '#09090b',
  '--color-border': '#e4e4e7',
  '--color-accent': '#18181b',
  '--color-accent-bg': '#f4f4f5',
} as React.CSSProperties;

const FIELD_MAP: Record<string, { key: keyof Issue; fallback: string }> = {
  Type: { key: 'type', fallback: 'Issue' },
  Severity: { key: 'severity', fallback: 'Normal' },
  Priority: { key: 'priority', fallback: 'Medium' },
  Status: { key: 'status', fallback: 'Todo' },
};

const IssuesBoard = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [isAssignePopUp, setIsAssignePopUp] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const activeProject = useAppSelector((state) => state.activeProject);
  const projectId = activeProject.data?._id;
  const {
   
    createStoryForSprintId,
  } = useAppSelector(s => s.scrum);
  const syncIssueInList = useCallback((updatedIssue: Issue) => {
    if (!updatedIssue?._id) return;
    setIssues((prev) =>
      prev.map((it) => (it._id === updatedIssue._id ? { ...it, ...updatedIssue } : it)),
    );
  }, []);

  const handleIssueUpdate = useCallback((issueId: string, updates: Partial<Issue>) => {
    setIssues((prev) =>
      prev.map((it) => (it._id === issueId ? { ...it, ...updates } : it)),
    );
  }, []);

  useEffect(() => {
    const getIssues = async () => {
      if (!projectId) return;
      try {
        setLoading(true);
        setError('');
        const response = await axiosInstance.get(`/issue/get_all_issue/${projectId}`);
        setIssues(response.data?.issues || []);
      } catch (err: unknown) {
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setError(message || 'Failed to fetch issues.');
      } finally {
        setLoading(false);
      }
    };
    void getIssues();
  }, [projectId]);

  const assigneeNames = useMemo(() => {
    const names = (activeProject.data?.members ?? []).map((m: any) => m.name).filter(Boolean);
    return Array.from(new Set(names));
  }, [activeProject.data?.members]);

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      { label: 'Type', options: ['Bug', 'Feature', 'Issue'] },
      { label: 'Severity', options: ['Low', 'Normal', 'High', 'Critical'] },
      { label: 'Priority', options: ['Low', 'Medium', 'High'] },
      { label: 'Status', options: ['Todo', 'In-Progress', 'Review', 'Done'] },
      { label: 'Assigned to', options: assigneeNames },
    ],
    [assigneeNames],
  );

  const toggleFilterOption = useCallback((group: string, opt: string) => {
    setSelectedFilters((prev) => {
      const current = prev[group] ?? [];
      return {
        ...prev,
        [group]: current.includes(opt)
          ? current.filter((v) => v !== opt)
          : [...current, opt],
      };
    });
  }, []);

  const clearGroup = useCallback((group: string) => {
    setSelectedFilters((prev) => ({ ...prev, [group]: [] }));
  }, []);

  const clearAllFilters = useCallback(() => setSelectedFilters({}), []);

  const filteredIssues = useMemo(() => {
    const q = search.trim().toLowerCase();

    return issues.filter((issue) => {
      if (q) {
        const matchesSearch =
          issue.title?.toLowerCase().includes(q) ||
          issue.issueKey?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      for (const [group, values] of Object.entries(selectedFilters)) {
        if (!values.length) continue;

        if (group === 'Assigned to') {
          const name = issue.assignedTo?.name;
          if (!name || !values.includes(name)) return false;
          continue;
        }

        const mapping = FIELD_MAP[group];
        if (!mapping) continue;
        const value = (issue[mapping.key] as string) || mapping.fallback;
        if (!values.includes(value)) return false;
      }

      return true;
    });
  }, [issues, search, selectedFilters]);

  return (
    <div style={lightMode} className="space-y-5 bg-bg min-h-full py-4 px-8 min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-h">Issues</h1>
          <p className="text-sm text-text/60 mt-1">
            {loading ? (
              <span className="inline-block h-3.5 w-32 rounded-sm bg-accent-bg animate-pulse" />
            ) : (
              `${filteredIssues.length} issue${filteredIssues.length !== 1 ? 's' : ''} in this project`
            )}
          </p>
        </div>
        <button
          onClick={() => setIsPopupOpen(true)}
          className="inline-flex cursor-pointer items-center gap-2 bg-accent text-bg text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-85 transition-opacity"
        >
          <Plus size={16} />
          New issue
        </button>
      </div>

      <IssueTopBar
        groups={filterGroups}
        selected={selectedFilters}
        onToggleOption={toggleFilterOption}
        onClearGroup={clearGroup}
        onClearAll={clearAllFilters}
        search={search}
        onSearchChange={setSearch}
      />

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-accent-bg px-4 py-3 text-sm text-text">
          <AlertCircle size={15} className="text-accent shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex-1 rounded-2xl border border-border bg-bg">
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="h-3 w-10 rounded-sm bg-accent-bg" />
                <div className="h-3 flex-1 rounded-sm bg-accent-bg" />
                <div className="h-3 w-14 rounded-sm bg-accent-bg" />
                <div className="h-3 w-12 rounded-sm bg-accent-bg" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <IssueTable
          issues={filteredIssues}
          setIsAssignePopUp={setIsAssignePopUp}
          onIssueUpdate={handleIssueUpdate}
        />
      )}

      {isAssignePopUp && (
        <AddMembersToIssue
          onClose={() => setIsAssignePopUp(false)}
          onListSync={syncIssueInList}
        />
      )}

      {isPopupOpen && (
        <CreateIssuePage
          onClose={() => setIsPopupOpen(false)}
          setIssues={setIssues}
          issues={issues}
          sprintId= {createStoryForSprintId}
        />
      )}
    </div>
  );
};

export default IssuesBoard;