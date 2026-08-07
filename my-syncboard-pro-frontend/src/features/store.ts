/**
 * Global Redux Toolkit Central Store
 * Assembles all sliced states into a single immutable tree layout
 */

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '../config/app.config';
import { getFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';
import authReducer from './auth/authSlice';
import memberReducer, { initialMemberState } from './auth/memberSlice';
import activeProjectReducer, { initialActiveProjectState } from './activeProject/activeProjectSlice';
import activeIssueReducer from './activeIssue/activeIssueSlice';
import scrumReducer, { initialScrumState } from './activeScrum/scrumSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  members: memberReducer,
  activeProject: activeProjectReducer,
  activeIssue: activeIssueReducer,
  scrum: scrumReducer,
});

const persistedActiveProject = getFromLocalStorage<{ data: typeof initialActiveProjectState.data; loading: boolean; error: string | null }>(STORAGE_KEYS.ACTIVE_PROJECT);
const persistedScrum = getFromLocalStorage<{
  sprints: typeof initialScrumState.sprints;
  activeSprint: typeof initialScrumState.activeSprint;
  backlogStories: typeof initialScrumState.backlogStories;
  storiesBySprint: typeof initialScrumState.storiesBySprint;
  tasksByStory: typeof initialScrumState.tasksByStory;
  activeSprintTasks: typeof initialScrumState.activeSprintTasks;
}>(STORAGE_KEYS.SCRUM);
const persistedMembers = getFromLocalStorage<typeof initialMemberState>(STORAGE_KEYS.MEMBERS);

const preloadedState = {
  activeProject: persistedActiveProject
    ? { ...initialActiveProjectState, ...persistedActiveProject, data: persistedActiveProject.data ?? null }
    : undefined,
  scrum: persistedScrum
    ? { ...initialScrumState, ...persistedScrum }
    : undefined,
  members: persistedMembers
    ? { ...initialMemberState, ...persistedMembers }
    : undefined,
} as any;

export const store = configureStore({
  reducer: rootReducer,
  preloadedState,
});

store.subscribe(() => {
  const state = store.getState();

  saveToLocalStorage(STORAGE_KEYS.ACTIVE_PROJECT, {
    data: state.activeProject.data ?? null,
    loading: false,
    error: null,
  });

  saveToLocalStorage(STORAGE_KEYS.SCRUM, {
    sprints: state.scrum.sprints,
    activeSprint: state.scrum.activeSprint,
    backlogStories: state.scrum.backlogStories,
    storiesBySprint: state.scrum.storiesBySprint,
    tasksByStory: state.scrum.tasksByStory,
    activeSprintTasks: state.scrum.activeSprintTasks,
  });

  saveToLocalStorage(STORAGE_KEYS.MEMBERS, {
    activeMembers: state.members.activeMembers,
    pendingInvitations: state.members.pendingInvitations,
    isMembersLoading: false,
    isInvitesLoading: false,
    error: null,
  });
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;