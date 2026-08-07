import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ProjectMember {
  _id: string;
  name: string;
  email: string;
  role?: string;
   title?: string; 
  department?: string;
  avatar?: string;
}

export interface ActiveProjectData {
  _id: string;
  name: string;
  description?: string;
  companyId: string;
  project_owner?: ProjectMember;
  members: ProjectMember[];
  createdAt?: string;
  updatedAt?: string;
}

interface ActiveProjectState {
  data: ActiveProjectData | null;
  loading: boolean;
  error: string | null;
}

export const initialActiveProjectState: ActiveProjectState = {
  data: null,
  loading: false,
  error: null,
};

const activeProjectSlice = createSlice({
  name: 'activeProject',
  initialState: initialActiveProjectState,
  reducers: {
    setActiveProjectStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setActiveProjectSuccess: (state, action: PayloadAction<ActiveProjectData>) => {
      state.loading = false;
      state.data = action.payload;
      state.error = null;
    },
    setActiveProjectFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearActiveProject: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setActiveProjectStart,
  setActiveProjectSuccess,
  setActiveProjectFailure,
  clearActiveProject,
} = activeProjectSlice.actions;

export default activeProjectSlice.reducer;
