/**
 * Application Configuration Management
 * Strictly typed configuration boundaries for system parameters
 */

// We use 'as const' here. This tells TypeScript that these values are read-only (immutable) 
// and cannot be modified anywhere else in the application.
export const APP_CONFIG = {
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000/api',
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'syncboard_auth_token',
  USER: 'syncboard_user_data',
  ACTIVE_PROJECT: 'syncboard_active_project',
  SCRUM: 'syncboard_scrum_state',
  MEMBERS: 'syncboard_members_state',
} as const;