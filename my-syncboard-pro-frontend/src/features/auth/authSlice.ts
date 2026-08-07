/**
 * Authentication Redux Slice
 * Manages user state, login tokens, and role allocations
 */

import { createSlice } from '@reduxjs/toolkit';
// Type-only imports for strict type configurations
import type { PayloadAction } from '@reduxjs/toolkit';
import { getFromLocalStorage, saveToLocalStorage, removeFromLocalStorage } from '../../utils/localStorage';
import { STORAGE_KEYS } from '../../config/app.config';
import { normalizeRole, type AppRole } from '../../config/permissions';

// 1. Define the User metadata structure inside the state
export interface UserData {
  id: string,
  name: string;
  email: string;
  role: AppRole | 'SuperAdmin';
  mobileNumber?: string | number;
  department?: string;
  title?: string;
}

// 2. Define the strict interface for the Authentication state slice
interface AuthState {
  token: string | null;
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
}

// 3. Hydrate state directly from localStorage so that the user session survives page refreshes
const initialState: AuthState = {
  token: getFromLocalStorage<string>(STORAGE_KEYS.TOKEN),
  user: getFromLocalStorage<UserData>(STORAGE_KEYS.USER),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    // PayloadAction<T> strictly tells TS what format the data must be when dispatching action
    setAuthSuccess: (state, action: PayloadAction<{ token: string; user: UserData }>) => {
      state.isLoading = false;
      state.token = action.payload.token;
      state.user = {
        ...action.payload.user,
        role: normalizeRole(action.payload.user.role),
      };
      state.error = null;

      // Commit to local disk storage via our type-safe helper
      saveToLocalStorage(STORAGE_KEYS.TOKEN, action.payload.token);
      saveToLocalStorage(STORAGE_KEYS.USER, state.user);
    },
    setAuthFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logoutUser: (state) => {
      state.token = null;
      state.user = null;
      state.isLoading = false;
      state.error = null;

      // Wipe out keys from storage
      removeFromLocalStorage(STORAGE_KEYS.TOKEN);
      removeFromLocalStorage(STORAGE_KEYS.USER);
    },
  },
});

export const { setAuthStart, setAuthSuccess, setAuthFailure, logoutUser } = authSlice.actions;
export default authSlice.reducer;