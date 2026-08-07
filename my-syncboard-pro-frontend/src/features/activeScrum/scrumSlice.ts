import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ScrumState, ISprint, IUserStory, ITask } from '../../types/scrum.types';
import axiosInstance from '../../api/axiosInstance';

// ==========================================
// ── 1. ASYNC THUNKS (API CALLS) ──
// ==========================================
export const createSprintAsync = createAsyncThunk(
  'scrum/createSprint',
  async (
    payload: { projectId: string; name: string; goal?: string; startDate?: string; endDate?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.post('/sprint/create', payload);
      return res.data.sprint || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create sprint');
    }
  }
);

export const createStoryAsync = createAsyncThunk(
  'scrum/createStory',
  async (
    payload: {
      projectId: string;
      title: string;
      description?: string;
      storyPoints: number;
      sprintId: string | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.post('/story/create', payload);
      return res.data.story || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create story');
    }
  }
);

export const fetchSprintsAsync = createAsyncThunk(
  'scrum/fetchSprints',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/sprint/get_all/${projectId}`);
      return res.data.sprints || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch sprints');
    }
  }
);

export const fetchBacklogStoriesAsync = createAsyncThunk(
  'scrum/fetchBacklogStories',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/story/get_backlog/${projectId}`);
      return res.data.stories || res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch backlog stories');
    }
  }
);

export const fetchStoriesBySprintAsync = createAsyncThunk(
  'scrum/fetchStoriesBySprint',
  async (sprintId: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/story/get_by_sprint/${sprintId}`);
      return { sprintId, stories: res.data.stories || res.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch sprint stories');
    }
  }
);

export const moveStoryAsync = createAsyncThunk(
  'scrum/moveStory',
  async (
    payload: { storyId: string; targetSprintId: string | null },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosInstance.put(`/story/move_to_sprint/${payload.storyId}`, {
        sprintId: payload.targetSprintId,
      });
      return { storyId: payload.storyId, targetSprintId: payload.targetSprintId, updatedStory: res.data.story || res.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to move story');
    }
  }
);

// ==========================================
// ── 2. INITIAL STATE ──
// ==========================================
export const initialScrumState: ScrumState = {
  sprints: [],
  activeSprint: null,
  backlogStories: [],
  storiesBySprint: {},
  tasksByStory: {},
  activeSprintTasks: [],
  loading: false,
  boardLoading: false,
  error: null,
  showCreateSprint: false,
  showCreateStory: false,
  showCreateTask: false,
  showCreateIssues: false,
  createStoryForSprintId: null,
  createIssues: null,
  confirmModal: { isOpen: false, title: '', message: '' },
};

const getStoryIdString = (storyId: any): string => {
  if (!storyId) return '';
  return typeof storyId === 'object' && storyId._id ? storyId._id : String(storyId);
};

// ==========================================
// ── 3. SCRUM SLICE ──
// ==========================================
const scrumSlice = createSlice({
  name: 'scrum',
  initialState: initialScrumState,
  reducers: {
    // ── LOADING REDUCERS ──
    resetScrumState: () => initialScrumState,
    setLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    setBoardLoading: (state) => {
      state.boardLoading = true;
    },

    // ── SPRINT REDUCERS ──
    setSprints: (state, action: PayloadAction<ISprint[]>) => {
      state.loading = false;
      state.sprints = action.payload;
      // ✅ FIX: pehle ye hamesha status==='active' dhoondh ke activeSprint set kar deta tha,
      // jo Sidebar se manually select kiya hua sprint (setActiveSprint) wipe kar deta tha
      // — chahe koi bhi sprint status 'active' na ho, ye har fetch par null overwrite kar deta.
      // Ab: agar user ne pehle se koi sprint select kar rakha hai aur wo naye data me abhi bhi
      // maujood hai, to usi ko (refreshed object ke sath) rakhte hain.
      if (state.activeSprint) {
        const stillExists = action.payload.find(s => s._id === state.activeSprint!._id);
        state.activeSprint = stillExists ?? action.payload.find(s => s.status === 'active') ?? null;
      } else {
        state.activeSprint = action.payload.find(s => s.status === 'active') ?? null;
      }
    },
    addSprint: (state, action: PayloadAction<ISprint>) => {
      state.sprints.unshift(action.payload);
    },
    updateSprintStatus: (state, action: PayloadAction<ISprint>) => {
      const idx = state.sprints.findIndex(s => s._id === action.payload._id);
      if (idx !== -1) state.sprints[idx] = action.payload;
      state.activeSprint = state.sprints.find(s => s.status === 'active') ?? null;
    },
    // Sidebar me sprint pe click karne par ye "currently viewing" sprint set karta hai —
    // backend ke `status === 'active'` field se independent hai.
    setActiveSprint: (state, action: PayloadAction<ISprint | null>) => {
      state.activeSprint = action.payload;
    },

    // ── USER STORY REDUCERS ──
    setBacklogStories: (state, action: PayloadAction<IUserStory[]>) => {
      state.loading = false;
      state.backlogStories = action.payload;
    },
    setSprintStories: (state, action: PayloadAction<{ sprintId: string; stories: IUserStory[] }>) => {
      state.loading = false;
      state.storiesBySprint[action.payload.sprintId] = action.payload.stories;
    },
    addStory: (state, action: PayloadAction<IUserStory>) => {
      const story = action.payload;
      if (!story.sprintId) {
        state.backlogStories.push(story);
      } else {
        const list = state.storiesBySprint[story.sprintId] ?? [];
        state.storiesBySprint[story.sprintId] = [...list, story];
      }
    },
    moveStoryToSprint: (state, action: PayloadAction<{ storyId: string; targetSprintId: string | null }>) => {
      const { storyId, targetSprintId } = action.payload;

      let storyIndex = state.backlogStories.findIndex(s => s._id === storyId);
      let story = storyIndex !== -1 ? state.backlogStories.splice(storyIndex, 1)[0] : undefined;

      if (!story) {
        for (const sId in state.storiesBySprint) {
          const idx = state.storiesBySprint[sId].findIndex(s => s._id === storyId);
          if (idx !== -1) {
            story = state.storiesBySprint[sId].splice(idx, 1)[0];
            break;
          }
        }
      }

      if (!story) return;

      story.sprintId = targetSprintId as any;

      if (targetSprintId) {
        const list = state.storiesBySprint[targetSprintId] ?? [];
        state.storiesBySprint[targetSprintId] = [...list, story];
      } else {
        state.backlogStories.push(story);
      }
    },

    // ── TASK REDUCERS ──
    setTasksByStory: (state, action: PayloadAction<{ storyId: any; tasks: ITask[] }>) => {
      const sId = getStoryIdString(action.payload.storyId);
      if (sId) {
        state.tasksByStory[sId] = action.payload.tasks;
      }
    },
    addTask: (state, action: PayloadAction<ITask>) => {
      const task = action.payload;
      const sId = getStoryIdString(task.storyId);

      if (!state.activeSprintTasks.some(existing => existing._id === task._id)) {
        state.activeSprintTasks.push(task);
      }

      if (sId) {
        const list = state.tasksByStory[sId] ?? [];
        if (!list.some(existing => existing._id === task._id)) {
          state.tasksByStory[sId] = [...list, task];
        }
      }
    },
    setActiveSprintTasks: (state, action: PayloadAction<ITask[]>) => {
      state.boardLoading = false;
      state.activeSprintTasks = action.payload;
    },
    updateTaskInBoard: (state, action: PayloadAction<ITask>) => {
      const updatedTask = action.payload;
      const boardIdx = state.activeSprintTasks.findIndex(t => t._id === updatedTask._id);
      if (boardIdx !== -1) {
        state.activeSprintTasks[boardIdx] = updatedTask;
      }
      const sId = getStoryIdString(updatedTask.storyId);
      const storyTasks = state.tasksByStory[sId];
      if (storyTasks) {
        const si = storyTasks.findIndex(t => t._id === updatedTask._id);
        if (si !== -1) {
          storyTasks[si] = updatedTask;
        }
      }
    },
    removeTask: (state, action: PayloadAction<ITask | string>) => {
      const taskId = typeof action.payload === 'string' ? action.payload : action.payload._id;
      if (!taskId) return;

      state.activeSprintTasks = state.activeSprintTasks.filter(task => task._id !== taskId);

      Object.keys(state.tasksByStory).forEach((storyId) => {
        state.tasksByStory[storyId] = state.tasksByStory[storyId].filter(task => task._id !== taskId);
      });
    },
    moveTaskToStory: (
      state,
      action: PayloadAction<{ task: ITask; fromStoryId: string; toStoryId: string }>
    ) => {
      const { task, fromStoryId, toStoryId } = action.payload;
      const fromId = getStoryIdString(fromStoryId);
      const toId = getStoryIdString(toStoryId);

      if (fromId && state.tasksByStory[fromId]) {
        state.tasksByStory[fromId] = state.tasksByStory[fromId].filter(t => t._id !== task._id);
      }

      if (toId) {
        const list = state.tasksByStory[toId] ?? [];
        const idx = list.findIndex(t => t._id === task._id);
        if (idx !== -1) {
          list[idx] = task;
        } else {
          list.push(task);
        }
        state.tasksByStory[toId] = list;
      }

      const boardIdx = state.activeSprintTasks.findIndex(t => t._id === task._id);
      if (boardIdx !== -1) {
        state.activeSprintTasks[boardIdx] = task;
      }
    },

    // ── GLOBAL MODALS CONTROL ──
    openCreateSprint: (state) => {
      state.showCreateSprint = true;
    },
    closeCreateSprint: (state) => {
      state.showCreateSprint = false;
    },
    openCreateTask: (state) => {
      state.showCreateTask = true;
    },
    closeCreateTask: (state) => {
      state.showCreateTask = false;
    },
    openCreateStory: (state, action: PayloadAction<string | null>) => {
      state.showCreateStory = true;
      state.createStoryForSprintId = action.payload;
    },
    closeCreateStory: (state) => {
      state.showCreateStory = false;
      state.createStoryForSprintId = null;
    },
    openCreateIssues: (state, action: PayloadAction<string | null>) => {
      state.showCreateIssues = true;
      state.createIssues = action.payload;
    },
    closeCreateIssues: (state) => {
      state.showCreateIssues = false;
      state.createIssues = null;
    },

    // ── ERROR HANDLE ──
    setError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.boardLoading = false;
      state.error = action.payload;
    },

    // ── CONFIRM MODAL ──
    openConfirmModal: (state, action: PayloadAction<{ title: string; message: string }>) => {
      state.confirmModal = { isOpen: true, title: action.payload.title, message: action.payload.message };
    },
    closeConfirmModal: (state) => {
      state.confirmModal = { isOpen: false, title: '', message: '' };
    },
  },

  // ── EXTRA REDUCERS FOR ASYNC THUNKS ──
  extraReducers: (builder) => {
    builder
      // ── CREATE STORY ──
      .addCase(createStoryAsync.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createStoryAsync.fulfilled, (state, action: PayloadAction<IUserStory>) => {
        state.loading = false;
        const story = action.payload;
        if (!story.sprintId) {
          state.backlogStories.push(story);
        } else {
          const list = state.storiesBySprint[story.sprintId] ?? [];
          state.storiesBySprint[story.sprintId] = [...list, story];
        }
      })
      .addCase(createStoryAsync.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // ── FETCH SPRINTS ──
      .addCase(fetchSprintsAsync.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSprintsAsync.fulfilled, (state, action: PayloadAction<ISprint[]>) => {
        state.loading = false;
        const sprints = Array.isArray(action.payload) ? action.payload : [];
        state.sprints = sprints;
      
        // ✅ FIX: agar user ne pehle se koi sprint manually select kar rakha hai
        // aur wo naye fetched data me abhi bhi maujood hai, to usi ko (refreshed
        // object ke saath) retain karo — sirf tabhi 'active' status wale sprint
        // ya null pe fallback karo jab koi selection na ho ya wo list se hat gaya ho.
        if (state.activeSprint) {
          const stillExists = sprints.find(s => s._id === state.activeSprint!._id);
          state.activeSprint = stillExists ?? sprints.find(s => s.status === 'active') ?? null;
        } else {
          state.activeSprint = sprints.find(s => s.status === 'active') ?? null;
        }
      })
      .addCase(fetchSprintsAsync.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // ── FETCH BACKLOG STORIES ──
      .addCase(fetchBacklogStoriesAsync.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBacklogStoriesAsync.fulfilled, (state, action: PayloadAction<IUserStory[]>) => {
        state.loading = false;
        state.backlogStories = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchBacklogStoriesAsync.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // ── FETCH STORIES BY SPRINT ──
      .addCase(fetchStoriesBySprintAsync.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStoriesBySprintAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { sprintId, stories } = action.payload;
        state.storiesBySprint[sprintId] = Array.isArray(stories) ? stories : [];
      })
      .addCase(fetchStoriesBySprintAsync.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      // ── MOVE STORY ──
      .addCase(moveStoryAsync.fulfilled, (state, action) => {
        const { storyId, targetSprintId } = action.payload;
        let movedStory: IUserStory | undefined;

        const backlogIndex = state.backlogStories.findIndex(s => s._id === storyId);
        if (backlogIndex !== -1) {
          [movedStory] = state.backlogStories.splice(backlogIndex, 1);
        }

        if (!movedStory) {
          for (const sId in state.storiesBySprint) {
            const idx = state.storiesBySprint[sId].findIndex(s => s._id === storyId);
            if (idx !== -1) {
              [movedStory] = state.storiesBySprint[sId].splice(idx, 1);
              break;
            }
          }
        }

        if (movedStory) {
          movedStory.sprintId = targetSprintId as any;
          if (!targetSprintId) {
            state.backlogStories.push(movedStory);
          } else {
            const list = state.storiesBySprint[targetSprintId] ?? [];
            state.storiesBySprint[targetSprintId] = [...list, movedStory];
          }
        }
      })

      // ── CREATE SPRINT ──
      .addCase(createSprintAsync.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createSprintAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.sprints.unshift(action.payload);
      })
      .addCase(createSprintAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  resetScrumState,
  setLoading,
  setBoardLoading,
  setSprints,
  addSprint,
  updateSprintStatus,
  setActiveSprint,
  setBacklogStories,
  setSprintStories,
  addStory,
  setTasksByStory,
  addTask,
  setActiveSprintTasks,
  updateTaskInBoard,
  removeTask,
  moveTaskToStory,
  moveStoryToSprint,
  openCreateSprint,
  openCreateTask,
  closeCreateTask,
  closeCreateSprint,
  openCreateStory,
  closeCreateStory,
  openCreateIssues,
  closeCreateIssues,
  setError,
  openConfirmModal,
  closeConfirmModal,
} = scrumSlice.actions;

export default scrumSlice.reducer;