import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutList, Circle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/storeHooks';
import {
  closeCreateSprint, closeCreateStory, closeCreateTask,
  fetchBacklogStoriesAsync, fetchSprintsAsync,
  fetchStoriesBySprintAsync, openCreateStory, openCreateTask, openCreateIssues, closeCreateIssues,
  setActiveSprintTasks,
  setTasksByStory,
  updateTaskInBoard,
  moveTaskToStory,
  setActiveSprint,
  updateSprintStatus,
} from '../../features/activeScrum/scrumSlice';
import CreateSprintModal from '../../components/scrum/CreateSprintModal';
import CreateStoryModal from '../../components/scrum/CreateStoryModal';
import CreateTaskModal from '../../components/scrum/CreateTaskModal';
import SprintCompleteModal from '../../components/scrum/SprintCompleteModal';
import SprintSettingsModal from '../../components/scrum/SprintSettingsModal';
import { BoardHeader } from '../../components/scrum/userStory/BoardHeader';
import { BoardStoryRow } from '../../components/scrum/userStory/BoardStoryRow';
import { SprintIssuesTable } from '../../components/scrum/userStory/SprintIssuesTable';
import type { ISprint } from '../../types/scrum.types';
import type { BoardStory, TaskStatus } from '../../types/Board.types';
import axiosInstance from '../../api/axiosInstance';
import CreateIssuePage from '../app/CreateIssuePage';
import type { Issue } from '../../types/issue';
import { canChangeTaskStatus, canEditTask, canManageSprint } from '../../config/permissions';
import { showToast } from '../../utils/toast';

/**
 * Formats an ISO date string into a human-readable "07 Jul 2026" format.
 */
const formatDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : '';

/**
 * ActiveBoardPage
 *
 * Renders the Scrum board for a specific sprint.
 *
 * Sprint resolution priority:
 *   1. ?sprintId query param in the URL
 *   2. The currently active sprint in Redux
 *   3. No sprint found → empty state
 */
export const ActiveBoardPage = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [issues, setIssues] = useState<Issue[]>([]);

  // ── Redux state ──────────────────────────────────────────
  const {
    sprints,
    storiesBySprint,
    activeSprintTasks, // ✅ single source of truth for "how many tasks in each column"
    tasksByStory,       // ✅ needed to compute a task's position when it moves to a new story
    showCreateSprint,
    showCreateTask,
    showCreateStory,
    showCreateIssues,
    createStoryForSprintId,
    createIssues
  } = useAppSelector(s => s.scrum);
  const activeProject = useAppSelector(s => s.activeProject);
  const currentUser = useAppSelector(s => s.auth.user);

  // ── Local UI state ───────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sprintActionLoading, setSprintActionLoading] = useState(false);

  /**
   * Tracks which story the "Add Task" button was clicked for.
   * Passed to CreateTaskModal so the new task is linked to the correct story.
   */
  const [currentStoryId, setCurrentStoryId] = useState('');

  // ── Resolve which sprint to display ─────────────────────
  const sprintIdFromUrl = new URLSearchParams(location.search).get('sprintId');
const sprint = sprintIdFromUrl
  ? sprints.find(s => s._id === sprintIdFromUrl)
  : sprints.find(s => s.status === 'active');

// ✅ ADD THIS: jo bhi sprint resolve hua (URL se), usko turant activeSprint se sync karo,
// taaki refresh/direct-URL/navigation ke baad bhi activeSprint kabhi stale/null na rahe.
useEffect(() => {
  if (sprint) {
    dispatch(setActiveSprint(sprint));
  }
}, [sprint?._id, dispatch]);

const canManageCurrentSprint = Boolean(canManageSprint(currentUser as any, activeProject.data as any, sprint as any));
const taskCounts = useMemo(() => ({
  total: activeSprintTasks.length,
  completed: activeSprintTasks.filter((task) => ['Done', 'done', 'Completed', 'completed', 'Closed', 'closed'].includes(String(task.status))).length,
  inProgress: activeSprintTasks.filter((task) => ['In-Progress', 'in-progress'].includes(String(task.status))).length,
  todo: activeSprintTasks.filter((task) => ['Todo', 'todo'].includes(String(task.status))).length,
}), [activeSprintTasks]);

 
  // ── Fetch sprints and their stories on mount ─────────────
  useEffect(() => {
    const projectId = activeProject.data?._id;
    if (!projectId) return;

    dispatch(fetchBacklogStoriesAsync(projectId));
    dispatch(fetchSprintsAsync(projectId)).then(res => {
      if (res.meta.requestStatus === 'fulfilled' && Array.isArray(res.payload)) {
        (res.payload as ISprint[]).forEach(s => dispatch(fetchStoriesBySprintAsync(s._id)));
      }
    });
  }, [dispatch, activeProject.data?._id]);

 const fetchSprintTasks = async (sprintId: string) => {
   try {
     const res = await axiosInstance.get(`/task/get_by_sprint/${sprintId}`);
     const tasks = res.data.tasks || res.data;

     dispatch(setActiveSprintTasks(tasks));

     if (Array.isArray(tasks)) {
       const grouped: Record<string, any[]> = {};

       tasks.forEach((t) => {
         const realStoryId = typeof t.storyId === 'object' && t.storyId?._id
           ? t.storyId._id
           : t.storyId;

         if (realStoryId) {
           if (!grouped[realStoryId]) grouped[realStoryId] = [];
           grouped[realStoryId].push(t);
         }
       });

       Object.entries(grouped).forEach(([storyId, storyTasks]) => {
         dispatch(setTasksByStory({ storyId, tasks: storyTasks }));
       });
     }
   } catch (err) {
     console.error('Failed to fetch tasks:', err);
   }
 };

 const fetchSprintIssues = async (sprintId: string) => {
   try {
     const res = await axiosInstance.get(`/issue/get_by_sprint/${sprintId}`);
     setIssues(res.data.issues || res.data);
   } catch (err) {
     console.error('Failed to fetch issues:', err);
   }
 };

 // ── Fetch tasks for the current sprint ───────────────────
 useEffect(() => {
   if (!sprint?._id) return;
   fetchSprintTasks(sprint._id);
 }, [sprint?._id, dispatch]);

 // ── Fetch issues for the current sprint ───────────────
 useEffect(() => {
   if (!sprint?._id) return;
   fetchSprintIssues(sprint._id);
 }, [sprint?._id]);

  // ── Stories for the current sprint (already in Redux) ────
  const stories = (sprint ? storiesBySprint[sprint._id] ?? [] : []) as BoardStory[];

  // ── Filter stories by search query (title or id) ─────────
  const filteredStories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return stories;
    return stories.filter(
      s => s.title.toLowerCase().includes(q) || s._id?.toLowerCase().includes(q)
    );
  }, [stories, searchQuery]);

  // ── Sprint progress statistics ────────────────────────────
  const isDone = (s: BoardStory) =>
    ['done', 'closed'].includes(s.status?.toLowerCase() ?? '');

  const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);
  const closedCount = stories.filter(isDone).length;
  const completedPoints = stories.filter(isDone).reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);
  const openCount = stories.length - closedCount;
  const progressPercent = totalPoints > 0
    ? Math.round((completedPoints / totalPoints) * 100)
    : 0;

  // ── Column task counts (used by BoardHeader) ─────────────
  // ✅ FIX: pehle ye `story.tasks` se calculate ho raha tha, jo tasksByStory se sync nahi tha —
  // isliye drag-drop ke baad header ke numbers purane reh jaate the.
  // Ab activeSprintTasks se calculate hota hai, jise updateTaskInBoard hamesha taaza rakhta hai.
  const countByCol = (col: TaskStatus) =>
    activeSprintTasks.filter(t => (t.status ?? 'Todo') === col).length;

  // ── Event handlers ────────────────────────────────────────

  /**
   * Core task-update handler — covers two cases in one place:
   *   1. Same-story status change (arrow buttons, or dragging within one story's row)
   *   2. Cross-story move (dragging a task from Story A's row into Story B's row) —
   *      in this case storyId AND status both change (status = whichever column it landed on).
   *
   * Optimistic: Redux updates instantly (card, story progress bar, and header
   * column counts all move together), then the server call confirms in the
   * background. On failure everything is rolled back to where it was.
   */
  const handleUpdateTask = async (
    taskId: string,
    targetStoryId: string,
    sourceStoryId: string,
    newStatus: TaskStatus
  ) => {
    const existingTask = activeSprintTasks.find(t => t._id === taskId);
    if (!existingTask) return;

    const canModifyTask = canEditTask(currentUser as any, existingTask as any);
    const canMoveStatus = canChangeTaskStatus(currentUser as any, existingTask as any);

    if (!canModifyTask && !canMoveStatus) {
      window.alert('You can only update tasks assigned to you or created by you.');
      return;
    }

    const previousStatus = existingTask.status;
    const previousPosition = (existingTask as any).position;
    const storyChanged = !!sourceStoryId && sourceStoryId !== targetStoryId;
    const statusChanged = previousStatus !== newStatus;
    if (!storyChanged && !statusChanged) return; // dropped back where it already was

    // When a task moves into a new story, put it at the end of that story's
    // task list (position = however many tasks are already there).
    const newPosition = storyChanged
      ? (tasksByStory[targetStoryId]?.length ?? 0)
      : previousPosition;

    const updatedTaskLocal = {
      ...existingTask,
      status: newStatus,
      storyId: targetStoryId as any,
      position: newPosition,
    };

    // 1. Optimistic update
    if (storyChanged) {
      dispatch(moveTaskToStory({ task: updatedTaskLocal, fromStoryId: sourceStoryId, toStoryId: targetStoryId }));
    } else {
      dispatch(updateTaskInBoard(updatedTaskLocal));
    }

    // 2. Confirm with the server — backend's updateTask controller supports
    //    partial updates, so we only send the fields that actually changed.
    //    (It also enforces: employees assigned to a task may ONLY change its status —
    //    a cross-story move by an employee will correctly get rejected with a 403.)
    try {
      const payload: Record<string, any> = {};
      if (statusChanged) payload.status = newStatus;
      if (storyChanged) {
        payload.storyId = targetStoryId;
        payload.position = newPosition;
      }

      const res = await axiosInstance.patch(`/task/update/${taskId}`, payload);
      const serverTask = res.data.task || res.data;

      if (storyChanged) {
        dispatch(moveTaskToStory({ task: serverTask, fromStoryId: sourceStoryId, toStoryId: targetStoryId }));
      } else {
        dispatch(updateTaskInBoard(serverTask));
      }
    } catch (err: any) {
      // Backend sends 403 when the current user isn't the assignee/owner/manager,
      // and 400 when the Zod schema rejects the payload — surface both clearly.
      const message = err?.response?.data?.message || 'Failed to update task';
      console.error(message);

      // 3. Rollback on failure
      const revertedTask = { ...existingTask, status: previousStatus, position: previousPosition };
      if (storyChanged) {
        dispatch(moveTaskToStory({ task: revertedTask, fromStoryId: targetStoryId, toStoryId: sourceStoryId }));
      } else {
        dispatch(updateTaskInBoard(revertedTask));
      }
    }
  };

  /**
   * Used by the ◀ ▶ arrow buttons on TaskCard — always a same-story status change.
   */
  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const existingTask = activeSprintTasks.find(t => t._id === taskId);
    if (!existingTask) return;
    const rawStoryId = existingTask.storyId as any;
    const storyId = typeof rawStoryId === 'object' ? rawStoryId?._id : rawStoryId;
    handleUpdateTask(taskId, storyId, storyId, newStatus);
  };

  /**
   * Fired when a TaskCard is dropped onto a column in BoardStoryRow.
   * targetStoryId = the story row the task was dropped into (may differ from its origin).
   */
  const handleTaskDrop = (e: React.DragEvent, targetStoryId: string, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const sourceStoryId = e.dataTransfer.getData('sourceStoryId') || targetStoryId;
    if (taskId) handleUpdateTask(taskId, targetStoryId, sourceStoryId, newStatus);
  };

  const handleOpenAddTask = (storyId: string) => {
    setCurrentStoryId(storyId);
    dispatch(openCreateTask());
  };

  const handleStartSprint = async () => {
    if (!sprint || !activeProject.data?._id) return;
    setSprintActionLoading(true);
    try {
      const response = await axiosInstance.put(`/sprint/start/${sprint._id}`, {
        projectId: activeProject.data._id,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
      });
      const updatedSprint = response.data.sprint || response.data;
      dispatch(updateSprintStatus(updatedSprint));
      showToast('Sprint started successfully.', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to start sprint.', 'error');
    } finally {
      setSprintActionLoading(false);
    }
  };

  const handleCompleteSprint = async (payload: { moveIncompleteTo: 'backlog' | 'sprint'; targetSprintId?: string }) => {
    if (!sprint) return;
    setSprintActionLoading(true);
    try {
      const response = await axiosInstance.put(`/sprint/complete/${sprint._id}`, payload);
      const updatedSprint = response.data.sprint || response.data;
      dispatch(updateSprintStatus(updatedSprint));

      if (activeProject.data?._id) {
        await dispatch(fetchBacklogStoriesAsync(activeProject.data._id));
        await dispatch(fetchSprintsAsync(activeProject.data._id));
      }
      await fetchSprintTasks(sprint._id);
      await fetchSprintIssues(sprint._id);

      const movedCount = response.data.rollover?.movedStories ?? response.data.rollover?.movedIssues ?? response.data.rollover?.movedTasks ?? 0;
      showToast(`Sprint completed! ${movedCount} unfinished work items moved ${payload.moveIncompleteTo === 'backlog' ? 'to backlog' : 'to another sprint'}.`, 'success');
      setShowCompleteModal(false);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to complete sprint.', 'error');
    } finally {
      setSprintActionLoading(false);
    }
  };

  const handleSaveSprintSettings = async (payload: { name: string; goal: string; startDate?: string; endDate?: string }) => {
    if (!sprint) return;
    setSprintActionLoading(true);
    try {
      const response = await axiosInstance.patch(`/sprint/update/${sprint._id}`, payload);
      const updatedSprint = response.data.sprint || response.data;
      dispatch(updateSprintStatus(updatedSprint));
      showToast('Sprint updated successfully.', 'success');
      setShowSettingsModal(false);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update sprint.', 'error');
    } finally {
      setSprintActionLoading(false);
    }
  };

  // ── Empty state: no sprint found ─────────────────────────
  if (!sprint) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mb-4">
          <LayoutList size={20} className="text-zinc-300" />
        </div>
        <p className="text-sm font-semibold text-zinc-700 mb-1">No active sprint</p>
        <p className="text-xs text-zinc-400">
          Start a sprint from the Backlog to see the board here.
        </p>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────
  return (
    <div id="board-scroll-root" className="bg-zinc-50 text-zinc-800 flex flex-col select-none">

      <BoardHeader
        sprint={sprint}
        storyCount={filteredStories.length}
        totalPoints={totalPoints}
        completedPoints={completedPoints}
        progressPercent={progressPercent}
        openCount={openCount}
        closedCount={closedCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        countByCol={countByCol}
        onAddStory={() => dispatch(openCreateStory(sprint._id))}
        formatDate={formatDate}
        taskCounts={taskCounts}
        canManage={canManageCurrentSprint}
        onStartSprint={handleStartSprint}
        onCompleteSprint={() => setShowCompleteModal(true)}
        onEditSprint={() => setShowSettingsModal(true)}
        isActionLoading={sprintActionLoading}
      />

      {/* Board body */}
      <div className="flex-1">
        <div className="bg-white border-b border-zinc-200 overflow-hidden">
          {filteredStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-dashed border-zinc-300 flex items-center justify-center mb-3">
                <Circle size={18} className="text-zinc-300" />
              </div>
              <p className="text-sm font-medium text-zinc-600 mb-1">
                {searchQuery ? 'No stories match your search' : 'No stories in this sprint'}
              </p>
              <p className="text-xs text-zinc-400">
                {searchQuery ? 'Try a different keyword.' : 'Add user stories to start tracking.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filteredStories.map((story, i) => (
                <BoardStoryRow
                  key={story._id}
                  story={story}
                  isAlt={i % 2 === 1}
                  onMoveTask={handleUpdateTaskStatus}
                  onDropTask={handleTaskDrop}
                  onAddTask={handleOpenAddTask}
                />
              ))}
            </div>
          )}
        </div>

        <SprintIssuesTable
          issues={issues}
          onAddIssue={() => dispatch(openCreateIssues(sprint._id))}
        />
      </div>

      {/* ── Modals ── */}
      {showCreateSprint && (
        <CreateSprintModal onClose={() => dispatch(closeCreateSprint())} />
      )}

      {showCreateStory && (
        <CreateStoryModal
          onClose={() => dispatch(closeCreateStory())}
          sprintId={createStoryForSprintId}
        />
      )}

      {showCreateTask && (
        <CreateTaskModal
          onClose={() => dispatch(closeCreateTask())}
          storyId={currentStoryId}
        />
      )}
      {showCreateIssues && (
        <CreateIssuePage
          onClose={() => dispatch(closeCreateIssues())}
          setIssues={setIssues}
          issues={issues}
          sprintId={createIssues}
        />
      )}
      {showCompleteModal && (
        <SprintCompleteModal
          sprint={sprint}
          targetSprints={sprints}
          completedCount={stories.filter((story) => ['Done', 'done', 'Closed', 'closed'].includes(String(story.status ?? ''))).length}
          incompleteCount={stories.filter((story) => !['Done', 'done', 'Closed', 'closed'].includes(String(story.status ?? ''))).length}
          isSubmitting={sprintActionLoading}
          onClose={() => setShowCompleteModal(false)}
          onConfirm={handleCompleteSprint}
        />
      )}
      {showSettingsModal && (
        <SprintSettingsModal
          sprint={sprint}
          isSubmitting={sprintActionLoading}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSprintSettings}
        />
      )}
    </div>
  );
};

export default ActiveBoardPage;