import { useEffect, useState } from 'react';
import { FolderKanban, Plus, Loader2, ArrowRight, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAppSelector } from '../hooks/storeHooks';

interface ProjectDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ProjectStatus = 'In progress' | 'Planning' | 'Review' | 'Completed';

export interface BackendProject {
  _id: string;
  name: string;
  description?: string;
  companyId: string;
  owner: string;
  members: string[];
  status?: ProjectStatus;
  lastUpdated?: string;
}

const getStatusConfig = (status?: ProjectStatus) => {
  switch (status) {
    case 'In progress':
      return { dot: 'bg-amber-500', label: 'text-amber-700', text: 'In progress' };
    case 'Completed':
      return { dot: 'bg-emerald-500', label: 'text-emerald-700', text: 'Completed' };
    case 'Review':
      return { dot: 'bg-indigo-500', label: 'text-indigo-700', text: 'Review' };
    case 'Planning':
      return { dot: 'bg-zinc-400', label: 'text-zinc-500', text: 'Planning' };
    default:
      return null;
  }
};

const ProjectDropdown = ({ isOpen, onClose }: ProjectDropdownProps) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isOpen) return;
    const getProjects = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('project/get');
        setProjects(response.data.projects || []);
      } catch (error) {
        console.error('Error fetching projects in ProjectDropdown', error);
      } finally {
        setLoading(false);
      }
    };
    getProjects();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown Panel */}
      <div className="absolute left-0 mt-2 w-72 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">

        {/* ── Project List ── */}
        <div className="max-h-[220px] overflow-y-auto py-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-thumb]:rounded-full">

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-zinc-400">
              <Loader2 size={16} className="animate-spin text-zinc-500" />
              <span className="text-xs font-medium">Loading...</span>
            </div>
          )}

          {/* Empty state */}
          {!loading && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-1.5 py-8">
              <div className="w-8 h-8 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center">
                <FolderKanban size={14} className="text-zinc-300" />
              </div>
              <p className="text-xs text-zinc-400 font-medium">No projects yet</p>
            </div>
          )}

          {/* Project items */}
          {!loading && projects.map((p) => {
            const statusConfig = getStatusConfig(p.status);
            return (
              <Link
                to={`/projects/${p._id}`}
                key={p._id}
                onClick={onClose}
                className="group flex items-center justify-between gap-3 px-3 py-2 mx-1 rounded-lg hover:bg-zinc-50 transition-colors duration-200"
              >
                {/* Left: icon + name + status */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 flex-shrink-0 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:bg-zinc-900 group-hover:border-zinc-900">
                    <FolderKanban
                      size={13}
                      className="text-zinc-700 transition-colors duration-200 group-hover:text-white"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-950 truncate group-hover:text-zinc-900 transition-colors leading-tight">
                      {p.name}
                    </p>
                    {statusConfig && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConfig.dot}`} />
                        <span className={`text-[10px] font-semibold leading-none ${statusConfig.label}`}>
                          {statusConfig.text}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: arrow */}
                <div className="flex items-center flex-shrink-0">
                  <ArrowRight
                    size={12}
                    className="text-zinc-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-zinc-100 p-1.5 space-y-1 bg-zinc-50/60">

          {/* All projects link */}
          <Link
            to="/projects"
            onClick={onClose}
            className="group flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <LayoutGrid size={13} className="text-zinc-500 group-hover:text-zinc-900 transition-colors" />
              <span className="text-[12px] font-medium text-zinc-600 group-hover:text-zinc-950 transition-colors">
                All projects
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-600 bg-white border border-zinc-200 px-1.5 py-0.5 rounded">
              {projects.length}
            </span>
          </Link>

          {/* New project button */}
          {user?.role !== 'employee' && (
            <Link to="/projects/new" onClick={onClose} className="block pt-1">
              <button className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-700 active:scale-[0.99] text-white py-2 rounded-lg text-[12px] font-bold tracking-wider shadow-sm transition-all duration-200 cursor-pointer">
                <Plus size={13} strokeWidth={3} />
                NEW PROJECT
              </button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectDropdown;