import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { NotebookPen } from 'lucide-react';
import { useAppSelector } from '../hooks/storeHooks';
import HomePage from '../pages/HomePage';
import AuthPage from '../pages/AuthPage.tsx';
import Dashboard from '../pages/app/Dashboard.tsx';
import { AppLayout } from '../layouts/AppLayout.tsx';
import { ProjectLayout } from '../layouts/ProjectLayout.tsx';
import ProjectCreate from '../pages/app/ProjectCreate.tsx'; 
import ProjectsPage from '../pages/app/ProjectsPage';
import ProjectDetailPage from '../pages/app/ProjectDetailPage.tsx';
import MyTasksPage from '../pages/app/MyTasksPage';
import Search from '../pages/Search.tsx';
import TeamPage from '../pages/app/TeamPage';
import SettingsPage from '../pages/app/SettingsPage';
import ProfilePage from '../pages/app/ProfilePage.tsx';
import IssueBoard from '../pages/app/IssueBoard.tsx';
import ProjectPlaceholderPage from '../pages/app/ProjectPlaceholderPage';
import Invite from '../pages/app/Invite.tsx';
import AcceptInvite from '../pages/app/AcceptInvite.tsx';
import AuthGuard from './guards/AuthGuard';
import RoleGuard from './guards/RoleGuard';
import IssueDetailPage from '../pages/app/IssueDetailPage.tsx';
import SearchRouteWrapper from '../components/SearchRouteWrapper';

import { BacklogPage } from '../pages/scrum/BacklogPage.tsx';
import { ActiveBoardPage } from '../pages/scrum/ActiveBoardPage.tsx';
import { Provider } from 'react-redux';
import { store } from '../features/store.ts';
import TaskDetailPage from '../pages/scrum/TaskDetailPage.tsx';
import StoryDetailPage from '../pages/scrum/StoryDetailPage.tsx';
import AccessDenied from '../components/rbac/AccessDenied';

const UnauthorizedPage = () => <AccessDenied />;

const NotFoundPage = () => (
  <div className="flex h-screen items-center justify-center bg-gray-100 text-xl font-bold text-gray-700">
    404 - Page not found
  </div>
);

export const AppRoutes = () => {
  const { token } = useAppSelector((state) => state.auth);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <HomePage />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected App Routes */}
      <Route element={<AuthGuard />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/settings/profile" element={<ProfilePage />} />

          {/* Role Guard: Owner / Manager */}
          <Route element={<RoleGuard allowedRoles={['owner', 'manager']} />}>
            <Route path="/projects/new" element={<ProjectCreate />} />
            <Route path="/invite" element={<Invite />} />
          </Route>

          {/* Role Guard: Only Owner */}
          <Route element={<RoleGuard allowedRoles={['owner']} />}>
            <Route path="/settings/workspace" element={<SettingsPage />} />
            <Route path="/settings/billing" element={<SettingsPage />} />
          </Route>

          {/* Role Guard: Superadmin */}
          <Route element={<RoleGuard allowedRoles={['superadmin']} />}>
            <Route path="/admin" element={<NotFoundPage />} />
            <Route path="/admin/workspaces" element={<NotFoundPage />} />
            <Route path="/admin/users" element={<NotFoundPage />} />
          </Route>

          {/*
            Scrum module wrapped in its own ScrumProvider so the Sidebar
            (rendered inside ProjectLayout) and the Backlog/Board pages
            share one live, in-memory instance of sprints/stories.
            The provider wraps ProjectLayout itself — not just the two
            scrum routes — because Sidebar lives one level above them.
          */}
          <Route element={<Provider store={store}><Outlet /></Provider>}>
            <Route element={<ProjectLayout />}>
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/projects/:projectId/board" element={<ActiveBoardPage />} />
              <Route path="/projects/:projectId/backlog" element={<BacklogPage />} />
              <Route path="/projects/:projectId/task/:taskId" element={<TaskDetailPage />} />

              <Route path="/projects/:projectId/story/:storyId" element={<StoryDetailPage />} />
              {/* Standard Project Routes */}
              <Route path="/projects/:projectId/issues" element={<IssueBoard />} />
              <Route path="/project/:projectId/issue/:issueId" element={<IssueDetailPage />} />
              <Route path="/projects/:projectId/search" element={<SearchRouteWrapper/>} />
              <Route path="/projects/:projectId/wiki" element={<ProjectPlaceholderPage title="Project Wiki" description="Keep project documentation, notes, and process details in one place." badge="Wiki" icon={NotebookPen} />} />
              <Route path="/projects/:projectId/team" element={<TeamPage />} />
              <Route path="/my-tasks" element={<MyTasksPage />} />
              <Route path="/team" element={<Navigate to="/projects" replace />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};