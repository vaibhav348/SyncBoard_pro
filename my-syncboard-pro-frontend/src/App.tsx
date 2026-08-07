import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import axiosInstance from './api/axiosInstance';
import { setActiveProjectFailure, setActiveProjectStart, setActiveProjectSuccess } from './features/activeProject/activeProjectSlice';
import { useAppDispatch, useAppSelector } from './hooks/storeHooks';
import { AppRoutes } from './routes/AppRoutes';
import type { ToastPayload, ToastType } from './utils/toast';

const AppShell = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const activeProject = useAppSelector((state) => state.activeProject.data);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const projectId = useMemo(() => {
    const match = location.pathname.match(/^\/projects\/([^/]+)/);
    return match?.[1] ?? null;
  }, [location.pathname]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastPayload>;
      setToast({ message: customEvent.detail.message, type: customEvent.detail.type ?? 'error' });
      window.setTimeout(() => setToast(null), 3000);
    };

    window.addEventListener('app:toast', handleToast);
    return () => window.removeEventListener('app:toast', handleToast);
  }, []);

  useEffect(() => {
    if (!token || !projectId || activeProject?._id === projectId) return;

    let cancelled = false;
    dispatch(setActiveProjectStart());

    axiosInstance
      .get(`/project/${projectId}`)
      .then((response) => {
        if (cancelled) return;
        const project = response.data?.project || response.data;
        if (project) {
          dispatch(setActiveProjectSuccess(project));
        } else {
          dispatch(setActiveProjectFailure('Unable to load project details.'));
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch(setActiveProjectFailure('Unable to load project details.'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeProject?._id, dispatch, projectId, token]);

  return (
    <div className="h-full min-h-0 relative">
      <AppRoutes />
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] min-w-[260px] max-w-[320px] rounded-lg border border-red-200 bg-white px-4 py-3 shadow-lg">
          <p className="text-sm font-semibold text-red-600">{toast.message}</p>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;