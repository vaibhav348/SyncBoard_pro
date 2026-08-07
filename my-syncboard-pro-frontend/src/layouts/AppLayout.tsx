import { Outlet } from 'react-router-dom';
import TopBar from '../components/TopBar';

export const AppLayout = () => {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-bg text-text">
      <TopBar />

      {/* ProjectLayout owns its scroll; other pages scroll via their own root wrapper */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};
