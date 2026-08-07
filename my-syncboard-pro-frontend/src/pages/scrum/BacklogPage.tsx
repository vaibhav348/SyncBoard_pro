import { useEffect, useState, useMemo } from 'react';
import type { DragEvent } from 'react';
import {
  Plus, ChevronDown, ChevronRight,
  SlidersHorizontal, MoreHorizontal, GripVertical, Calendar, Search, X
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../../hooks/storeHooks';
import {
  closeCreateSprint, closeCreateStory,
  fetchBacklogStoriesAsync, fetchSprintsAsync, fetchStoriesBySprintAsync,
  openCreateSprint, openCreateStory,
  moveStoryToSprint, moveStoryAsync, updateSprintStatus,
} from '../../features/activeScrum/scrumSlice';
import axiosInstance from '../../api/axiosInstance';
import CreateSprintModal from '../../components/scrum/CreateSprintModal';
import CreateStoryModal from '../../components/scrum/CreateStoryModal';
import type { ISprint, IUserStory } from '../../types/scrum.types';
import { formatDate } from '../../utils/formatDate';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { canManageSprint } from '../../config/permissions';
import { showToast } from '../../utils/toast';
import SprintCompleteModal from '../../components/scrum/SprintCompleteModal';
import SprintSettingsModal from '../../components/scrum/SprintSettingsModal';

interface LocalStory extends Omit<IUserStory, 'assignee'> {
  assignee?: any;
  status?: string;
}

const statusBadge: Record<string, string> = {
  'Todo': 'bg-zinc-100 text-zinc-600 border-zinc-200',
  'In-Progress': 'bg-blue-50 text-blue-700 border-blue-200/60',
  'Review': 'bg-violet-50 text-violet-700 border-violet-200/60',
  'Done': 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
};

const getAssigneeName = (assignee: LocalStory['assignee']): string => {
  if (!assignee) return 'Unassigned';
  if (typeof assignee === 'object' && 'name' in assignee) return assignee.name;
  return String(assignee);
};

// ── Truncate long words/strings for display ──
const truncateText = (text: string, maxLen: number): string => {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
};

/* ── Story Row ── */
interface StoryTableRowProps {
  story: LocalStory;
  onDragStart: (e: DragEvent<HTMLDivElement>, storyId: string) => void;
}

const StoryTableRow = ({ story, onDragStart }: StoryTableRowProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();

  const assigneeName = getAssigneeName(story.assignee);
  const initials = assigneeName !== 'Unassigned'
    ? assigneeName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '';

  const openStoryDetail = () => {
    if (!projectId) return;
    navigate(`/projects/${projectId}/story/${story._id}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, story._id)}
      className="group flex items-center gap-3 border-b border-zinc-100 bg-white px-4 py-3 hover:bg-zinc-50/60 transition-colors duration-150 cursor-grab active:cursor-grabbing"
    >
      {/* Grip + Checkbox */}
      <GripVertical size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
      <input
        type="checkbox"
        onClick={(e) => e.stopPropagation()}
        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3.5 w-3.5 cursor-pointer shrink-0"
      />

      {/* ID */}
      <span className="font-mono text-[11px] text-zinc-400 font-medium shrink-0">
        #{story._id ? story._id.slice(-4) : '0000'}
      </span>

      {/* Title + Description — flex-1 with min-w-0 so it compresses instead of overflowing */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); openStoryDetail(); }}
        className="flex flex-col min-w-0 flex-1 text-left hover:text-indigo-600 transition-colors"
      >
        {/* KEY FIX: break-all handles continuous strings without spaces */}
        <p className="text-[13px] font-medium text-zinc-800 break-all line-clamp-1 leading-snug">
          {story.title}
        </p>
        {story.description && (
          <p className="text-[11px] text-zinc-400 break-all line-clamp-1 leading-snug mt-0.5">
            {story.description}
          </p>
        )}
      </button>

      {/* Right side — fixed width, shrink-0 so it never gets squished */}
      <div className="flex items-center gap-3 shrink-0 ml-2">
        {/* Assignee */}
        {story?.assignee && (
          <div className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${initials ? 'bg-zinc-800 text-white' : 'bg-zinc-100 border border-zinc-200'}`}>
              {initials}
            </span>
            {/* Assignee name: max-w so it truncates, not overflows */}
            <span className="text-[11px] text-zinc-500 font-medium truncate max-w-[60px] hidden sm:block">
              {truncateText(story?.assignee?.name || '', 10)}
            </span>
          </div>
        )}

        {/* Status badge */}
        <span className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border whitespace-nowrap ${statusBadge[story.status || 'Todo']}`}>
          {story.status || 'Todo'}
        </span>

        {/* Story points */}
        <span className="font-mono text-[11px] text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded font-medium min-w-[36px] text-center whitespace-nowrap">
          {story.storyPoints > 0 ? `${story.storyPoints} SP` : '—'}
        </span>

        <button className="text-zinc-400 hover:text-zinc-700 p-1 rounded transition-colors">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
};

/* ── Main Backlog Page ── */
export const BacklogPage = () => {
  const dispatch = useAppDispatch();
  const scrumState = useAppSelector((state) => state.scrum) as any;
  const activeProject = useAppSelector((state) => state.activeProject);
  const currentUser = useAppSelector((state) => state.auth.user);

  const sprints = scrumState.sprints || [];
  const backlogStories = (scrumState.backlogStories || []) as LocalStory[];
  const storiesBySprint = scrumState.storiesBySprint || {};
  const showCreateSprint = scrumState.showCreateSprint;
  const showCreateStory = scrumState.showCreateStory;
  const createStoryForSprintId = scrumState.createStoryForSprintId;

  const { projectId } = useParams<{ projectId: string }>();
  const projectBasePath = projectId ? `/projects/${projectId}` : '/projects';
  const { hasPermission } = usePermissions();
  const canCreateStory = hasPermission('story.create');
  const canCreateSprint = hasPermission('sprint.create');

  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOverSprintId, setDragOverSprintId] = useState<string | null>(null);
  const [sprintActionLoading, setSprintActionLoading] = useState<string | null>(null);
  const [selectedSprintForAction, setSelectedSprintForAction] = useState<ISprint | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    if (activeProject.data?._id) {
      const pid = activeProject.data._id;
      dispatch(fetchBacklogStoriesAsync(pid));
      dispatch(fetchSprintsAsync(pid)).then((res: any) => {
        if (res.meta.requestStatus === 'fulfilled' && Array.isArray(res.payload)) {
          res.payload.forEach((sprint: ISprint) => dispatch(fetchStoriesBySprintAsync(sprint._id)));
        }
      });
    }
  }, [dispatch, activeProject.data?._id]);

  const filteredBacklogStories = useMemo<LocalStory[]>(() => {
    if (!searchQuery.trim()) return backlogStories;
    const q = searchQuery.toLowerCase();
    return backlogStories.filter(
      (s) => s.title.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
    );
  }, [backlogStories, searchQuery]);

  const toggleSprint = (sprintId: string) => {
    setExpandedSprints((prev) => {
      const next = new Set(prev);
      next.has(sprintId) ? next.delete(sprintId) : next.add(sprintId);
      return next;
    });
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, storyId: string) => {
    e.dataTransfer.setData('storyId', storyId);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetSprintId: string | null) => {
    e.preventDefault();
    setDragOverSprintId(null);
    const storyId = e.dataTransfer.getData('storyId');
    if (!storyId) return;
    dispatch(moveStoryToSprint({ storyId, targetSprintId }));
    const result = await dispatch(moveStoryAsync({ storyId, targetSprintId }));
    if (moveStoryAsync.rejected.match(result) && activeProject.data?._id) {
      dispatch(fetchBacklogStoriesAsync(activeProject.data._id));
      sprints.forEach((s: ISprint) => dispatch(fetchStoriesBySprintAsync(s._id)));
    }
  };

  const refreshSprintData = async () => {
    if (!activeProject.data?._id) return;
    await dispatch(fetchBacklogStoriesAsync(activeProject.data._id));
    await dispatch(fetchSprintsAsync(activeProject.data._id));
  };

  const handleStartSprint = async (sprintId: string) => {
    setSprintActionLoading(sprintId);
    try {
      const res = await axiosInstance.put(`/sprint/start/${sprintId}`, { projectId: activeProject.data?._id });
      dispatch(updateSprintStatus(res.data.sprint || res.data));
      await refreshSprintData();
      showToast('Sprint started successfully.', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to start sprint.', 'error');
    } finally {
      setSprintActionLoading(null);
    }
  };

  const handleCompleteSprint = async (payload: { moveIncompleteTo: 'backlog' | 'sprint'; targetSprintId?: string }) => {
    if (!selectedSprintForAction) return;
    setSprintActionLoading(selectedSprintForAction._id);
    try {
      const res = await axiosInstance.put(`/sprint/complete/${selectedSprintForAction._id}`, payload);
      dispatch(updateSprintStatus(res.data.sprint || res.data));
      await refreshSprintData();
      const movedCount = res.data.rollover?.movedStories ?? res.data.rollover?.movedIssues ?? res.data.rollover?.movedTasks ?? 0;
      showToast(`Sprint completed! ${movedCount} items moved ${payload.moveIncompleteTo === 'backlog' ? 'to backlog' : 'to another sprint'}.`, 'success');
      setShowCompleteModal(false);
      setSelectedSprintForAction(null);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to complete sprint.', 'error');
    } finally {
      setSprintActionLoading(null);
    }
  };

  const handleSaveSprintSettings = async (payload: { name: string; goal: string; startDate?: string; endDate?: string }) => {
    if (!selectedSprintForAction) return;
    setSprintActionLoading(selectedSprintForAction._id);
    try {
      const res = await axiosInstance.patch(`/sprint/update/${selectedSprintForAction._id}`, payload);
      dispatch(updateSprintStatus(res.data.sprint || res.data));
      await refreshSprintData();
      showToast('Sprint updated successfully.', 'success');
      setShowSettingsModal(false);
      setSelectedSprintForAction(null);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update sprint.', 'error');
    } finally {
      setSprintActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-800 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-3 items-start border-t border-zinc-100">

        {/* ===== LEFT: BACKLOG ===== */}
        <div
          className="lg:col-span-2 border-r border-zinc-100 py-5 px-6 min-h-screen space-y-4"
          onDragOver={(e) => { e.preventDefault(); setDragOverSprintId('backlog'); }}
          onDragLeave={() => setDragOverSprintId(null)}
          onDrop={(e) => handleDrop(e, null)}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-black">Backlog</h1>
              <p className="text-xs text-zinc-400 mt-0.5">{backlogStories.length} user stories in repository</p>
            </div>
            {canCreateStory && (
              <button
                onClick={() => dispatch(openCreateStory(null))}
                className="inline-flex cursor-pointer items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <Plus size={13} /> Add User Story
              </button>
            )}
          </div>

          {/* Search + Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className="w-full bg-white border border-zinc-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X size={12} />
                </button>
              )}
            </div>
            <button className="inline-flex items-center gap-1 text-xs text-zinc-600 bg-white border border-zinc-200 px-2.5 py-1.5 rounded-lg hover:bg-zinc-50 transition-all shrink-0">
              <SlidersHorizontal size={12} />
              <span>Filters</span>
            </button>
          </div>

          {/* Backlog Table */}
          <div className={`border rounded-xl overflow-hidden transition-colors ${dragOverSprintId === 'backlog' ? 'border-zinc-900 ring-2 ring-zinc-900/10' : 'border-zinc-200'}`}>
            {/* Table Header */}
            <div className="flex items-center justify-between bg-zinc-900 px-4 py-2.5">
              <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-200">
                Backlog Items
              </span>
              <span className="text-[10px] text-zinc-500 font-mono hidden sm:block">
                Drag story here to remove from sprint
              </span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-zinc-100 bg-white">
              {filteredBacklogStories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <p className="text-sm font-medium text-zinc-500 mb-1">
                    {searchQuery ? `No stories match "${searchQuery}"` : 'Backlog is empty'}
                  </p>
                  <p className="text-xs text-zinc-400">Add user stories above, or drag one out of a sprint.</p>
                </div>
              ) : (
                filteredBacklogStories.map((story) => (
                  <StoryTableRow key={story._id} story={story} onDragStart={handleDragStart} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ===== RIGHT: SPRINTS ===== */}
        <div className="p-5 space-y-4 bg-zinc-50/40 min-h-screen border-l border-zinc-100">
          {/* Sprints Header */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h3 className="font-mono text-[11px] font-bold text-zinc-500 tracking-widest uppercase">
              {sprints.length} Sprints
            </h3>
            {canCreateSprint && (
              <button
                onClick={() => dispatch(openCreateSprint())}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                <Plus size={13} /> Add Sprint
              </button>
            )}
          </div>

          {/* Empty state */}
          {sprints.length === 0 && (
            <div className="border border-dashed border-zinc-200 bg-white rounded-xl p-6 text-center">
              <p className="text-xs font-medium text-zinc-600 mb-0.5">No sprints yet</p>
              <p className="text-[11px] text-zinc-400">Click Add Sprint to get started.</p>
            </div>
          )}

          {/* Sprint Cards */}
          <div className="space-y-3">
            {sprints.map((sprint: any) => {
              const isOpen = expandedSprints.has(sprint._id);
              const sprintStories = (storiesBySprint[sprint._id] || []) as LocalStory[];
              const completedCount = sprintStories.filter((s) => s.status === 'Done').length;
              const totalPoints = sprintStories.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
              const progressPct = sprintStories.length > 0 ? Math.round((completedCount / sprintStories.length) * 100) : 0;
              const isDropTarget = dragOverSprintId === sprint._id;

              return (
                <div
                  key={sprint._id}
                  onDragOver={(e) => { e.preventDefault(); setDragOverSprintId(sprint._id); }}
                  onDragLeave={() => setDragOverSprintId(null)}
                  onDrop={(e) => handleDrop(e, sprint._id)}
                  className={`bg-white border rounded-xl overflow-hidden transition-all ${isDropTarget ? 'border-zinc-900 ring-2 ring-zinc-900/10' : 'border-zinc-200'}`}
                >
                  <div className="p-3.5 space-y-2.5">
                    {/* Sprint name + actions */}
                    <div className="flex items-start gap-2">
                      {/* Toggle + Name — overflow is the key fix here too */}
                      <div
                        onClick={() => toggleSprint(sprint._id)}
                        className="flex items-center gap-1.5 cursor-pointer group select-none min-w-0 flex-1"
                      >
                        {isOpen
                          ? <ChevronDown size={13} className="text-zinc-400 group-hover:text-zinc-600 shrink-0" />
                          : <ChevronRight size={13} className="text-zinc-400 group-hover:text-zinc-600 shrink-0" />
                        }
                        {/* KEY FIX: break-all so long sprint names don't overflow the card */}
                        <span className="text-[12px] font-semibold text-zinc-900 break-all line-clamp-2 leading-snug">
                          {sprint.name}
                        </span>
                      </div>

                      {/* Status + Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        <span className={`font-mono text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border font-medium whitespace-nowrap ${
                          sprint.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                          : sprint.status === 'completed' ? 'bg-violet-50 text-violet-700 border-violet-200/50'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}>
                          {sprint.status || 'planned'}
                        </span>

                        {canManageSprint(currentUser as any, activeProject.data as any, sprint as any) && (
                          <>
                            {sprint.status === 'planned' && (
                              <button
                                onClick={() => handleStartSprint(sprint._id)}
                                disabled={sprintActionLoading === sprint._id}
                                className="text-[10px] font-semibold px-2 py-0.5 bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                              >
                                {sprintActionLoading === sprint._id ? '…' : 'Start'}
                              </button>
                            )}
                            {sprint.status === 'active' && (
                              <button
                                onClick={() => { setSelectedSprintForAction(sprint); setShowCompleteModal(true); }}
                                disabled={sprintActionLoading === sprint._id}
                                className="text-[10px] font-semibold px-2 py-0.5 border border-zinc-200 text-zinc-600 rounded hover:border-zinc-400 disabled:opacity-50 transition-colors whitespace-nowrap"
                              >
                                {sprintActionLoading === sprint._id ? '…' : 'Complete'}
                              </button>
                            )}
                            <button
                              onClick={() => { setSelectedSprintForAction(sprint); setShowSettingsModal(true); }}
                              className="text-[10px] font-semibold px-2 py-0.5 border border-zinc-200 text-zinc-600 rounded hover:border-zinc-400 transition-colors whitespace-nowrap"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Date range + stats */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {sprint.startDate && sprint.endDate ? (
                        <div className="inline-flex items-center gap-1 bg-zinc-100/80 text-zinc-600 border border-zinc-200/60 px-2 py-0.5 rounded-md font-mono text-[9px]">
                          <Calendar size={10} className="text-zinc-400 shrink-0" />
                          <span className="whitespace-nowrap">
                            {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
                          </span>
                        </div>
                      ) : <div />}
                      <div className="flex items-center gap-1.5 font-mono text-zinc-500 text-[10px] whitespace-nowrap">
                        <span>{sprintStories.length} items</span>
                        <span>•</span>
                        <span className="font-semibold text-zinc-700">{totalPoints} SP</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-0.5">
                      <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-800 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      {sprintStories.length > 0 && (
                        <div className="flex justify-end text-[9px] font-mono text-zinc-400">
                          {progressPct}% done
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded stories list */}
                  {isOpen && (
                    <div className="bg-zinc-50/50 border-t border-zinc-100 p-2.5 space-y-1.5">
                      {sprintStories.length === 0 ? (
                        <div className="border border-dashed border-zinc-200 rounded-lg p-4 text-center bg-white">
                          <p className="text-[11px] text-zinc-400">Drag a backlog story here to plan it</p>
                        </div>
                      ) : (
                        sprintStories.map((story) => (
                          <div
                            key={story._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, story._id)}
                            className="flex items-center justify-between gap-2 bg-white border border-zinc-200/60 rounded-lg px-2.5 py-2 text-xs cursor-grab active:cursor-grabbing hover:border-zinc-300 transition-colors"
                          >
                            {/* KEY FIX: story title in sprint list also gets break-all */}
                            <span className="font-medium text-zinc-800 break-all line-clamp-1 min-w-0 flex-1">
                              {story.title}
                            </span>
                            <span className={`text-[8px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border shrink-0 ${statusBadge[story.status || 'Todo']}`}>
                              {story.status || 'Todo'}
                            </span>
                          </div>
                        ))
                      )}
                      <Link
                        to={`${projectBasePath}/board?sprintId=${sprint._id}`}
                        className="block w-full text-center py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-bold tracking-wide uppercase rounded-lg transition-colors mt-1"
                      >
                        Open Sprint Taskboard
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals — unchanged */}
      {showCreateSprint && <CreateSprintModal onClose={() => dispatch(closeCreateSprint())} />}
      {showCreateStory && (
        <CreateStoryModal onClose={() => dispatch(closeCreateStory())} sprintId={createStoryForSprintId} />
      )}
      {showCompleteModal && selectedSprintForAction && (
        <SprintCompleteModal
          sprint={selectedSprintForAction}
          targetSprints={sprints}
          completedCount={Math.max(0, (storiesBySprint[selectedSprintForAction._id] || []).filter((s: LocalStory) => s.status === 'Done').length)}
          incompleteCount={Math.max(0, (storiesBySprint[selectedSprintForAction._id] || []).filter((s: LocalStory) => s.status !== 'Done').length)}
          isSubmitting={Boolean(sprintActionLoading === selectedSprintForAction._id)}
          onClose={() => { setShowCompleteModal(false); setSelectedSprintForAction(null); }}
          onConfirm={handleCompleteSprint}
        />
      )}
      {showSettingsModal && selectedSprintForAction && (
        <SprintSettingsModal
          sprint={selectedSprintForAction}
          isSubmitting={Boolean(sprintActionLoading === selectedSprintForAction._id)}
          onClose={() => { setShowSettingsModal(false); setSelectedSprintForAction(null); }}
          onSave={handleSaveSprintSettings}
        />
      )}
    </div>
  );
};

export default BacklogPage;