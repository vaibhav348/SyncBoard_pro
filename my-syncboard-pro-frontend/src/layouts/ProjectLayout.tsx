import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export const ProjectLayout = () => {
  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <Sidebar />

      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white">
            <div className="mx-auto w-full   ">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
