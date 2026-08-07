/**
 * Global Axios Instance
 * Automatically injects JWT authorization headers and handles global API errors
 */

import axios from 'axios'; 
import type { 
  InternalAxiosRequestConfig, 
  AxiosResponse, 
  AxiosError 
} from 'axios';
import { APP_CONFIG, STORAGE_KEYS } from '../config/app.config';
import { getFromLocalStorage } from '../utils/localStorage';
import { store } from '../features/store';
import { showToast } from '../utils/toast';

const axiosInstance = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject Auth Token in headers before every call
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // We strictly tell getFromLocalStorage that the expected return type is a 'string'
    const token = getFromLocalStorage<string>(STORAGE_KEYS.TOKEN);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<never> => {
    return Promise.reject(error);
  }
);

// Response Interceptors: Global Error Catching (e.g., Token expired)
axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError): Promise<never> => {
    const status = error.response?.status;
    if (status === 401) {
      console.warn('Session expired or unauthorized. Logging out...');
      localStorage.clear();
      window.location.href = '/';
    }

    if (status === 403) {
      const state = store.getState();
      const role = state.auth.user?.role ?? 'employee';
      console.warn(`Forbidden for role ${role}`);
      showToast('You do not have the required permissions for this action.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;