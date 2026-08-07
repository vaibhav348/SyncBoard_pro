import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, FolderKanban, Clock
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { useAppSelector } from '../../hooks/storeHooks';

export type ProjectStatus = 'In progress' | 'Planning' | 'Review' | 'Completed';

export interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface BackendProject {
  _id: string;
  name: string;
  description?: string;
  companyId: string;
  project_owner: PopulatedUser;
  members: PopulatedUser[];
  status?: ProjectStatus;
  lastUpdated?: string;
}

/* ---------- Status config — semantic dot + high contrast badge ---------- */
const statusConfig: Record<ProjectStatus, { dot: string; label: string }> = {
  'In progress': { dot: '#2563eb', label: 'In progress' }, // Slightly deeper blue
  'Planning':    { dot: '#d97706', label: 'Planning' },    // Deeper amber
  'Review':      { dot: '#7c3aed', label: 'Review' },      // Deeper purple
  'Completed':   { dot: '#059669', label: 'Completed' },   // Deeper emerald
};

const getInitials = (name?: string) =>
  (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

/* ---------- Skeleton ---------- */
const CardSkeleton = () => (
  <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 animate-pulse shadow-sm">
    <div className="flex items-center justify-between">
      <div className="h-9 w-9 rounded-lg bg-zinc-100" />
      <div className="h-5 w-20 rounded-md bg-zinc-100" />
    </div>
    <div className="h-4 w-3/4 rounded-md bg-zinc-100 mt-2" />
    <div className="h-3 w-full rounded-md bg-zinc-100" />
    <div className="h-3 w-2/3 rounded-md bg-zinc-100" />
    <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded-full bg-zinc-100" />
        <div className="h-3 w-20 rounded-md bg-zinc-100" />
      </div>
      <div className="h-5 w-12 rounded-md bg-zinc-100" />
    </div>
  </div>
);

/* ---------- Member avatars (stacked) ---------- */
const MemberAvatars = ({ members }: { members: PopulatedUser[] }) => {
  const visible = members.slice(0, 3);
  const overflow = members.length - 3;

  return (
    <div className="flex items-center">
      {visible.map((m, i) => (
        <div
          key={m._id}
          title={m.name}
          className="w-6 h-6 rounded-full bg-zinc-100 border border-white font-mono text-[9px] font-bold text-zinc-950 flex items-center justify-center shadow-sm"
          style={{ marginLeft: i === 0 ? 0 : '-8px', zIndex: visible.length - i }}
        >
          {getInitials(m.name)}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="w-6 h-6 rounded-full bg-zinc-900 border border-white font-mono text-[9px] font-bold text-white flex items-center justify-center shadow-sm"
          style={{ marginLeft: '-8px', zIndex: 0 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};

/* ---------- Project card ---------- */
const ProjectCard = ({ project }: { project: BackendProject }) => {
  const status = project.status ?? 'In progress';
  const cfg = statusConfig[status];

  return (
    <Link
      to={`/projects/${project._id}`}
      className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-900 hover:shadow"
    >
      {/* Top */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-800 shrink-0 transition-colors group-hover:bg-zinc-900 group-hover:border-zinc-900 group-hover:text-white shadow-sm">
            <FolderKanban size={16} />
          </div>

          {/* Status badge — solid high-contrast monochrome border */}
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-zinc-800 border border-zinc-300 bg-white px-2 py-1 rounded shadow-sm">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: cfg.dot }}
            />
            {cfg.label}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-zinc-950 line-clamp-1 mb-1.5 group-hover:text-zinc-900 transition-colors">
          {project.name}
        </h3>
        {/* ✅ Contrast Fixed: Changed from light slate to crisp zinc-600 */}
        <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2 min-h-[32px]">
          {project.description || 'No description provided.'}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-zinc-200/80 flex items-center justify-between gap-3">
        {/* Owner */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center text-[9px] font-black text-white shrink-0 uppercase shadow-sm">
            {getInitials(project.project_owner?.name)}
          </div>
          <span className="text-xs font-semibold text-zinc-800 truncate">
            {project.project_owner?.name ?? 'Owner'}
          </span>
        </div>

        {/* Right meta */}
        <div className="flex items-center gap-3 shrink-0">
          {project.members?.length > 0 && (
            <MemberAvatars members={project.members} />
          )}

          {project.lastUpdated && (
            <div className="flex items-center gap-1 text-zinc-500 font-medium">
              <Clock size={12} className="text-zinc-400" />
              <span className="font-mono text-[10px]">{project.lastUpdated}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

/* ---------- Empty state ---------- */
const EmptyGrid = ({ hasQuery }: { hasQuery: boolean }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/40 py-24 text-center">
    <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 mb-4 shadow-sm">
      <FolderKanban size={20} />
    </div>
    <h3 className="text-sm font-semibold text-zinc-950 mb-1.5">
      {hasQuery ? 'No projects match your search' : 'No projects yet'}
    </h3>
    <p className="text-xs text-zinc-600 max-w-xs mb-5">
      {hasQuery
        ? 'Try a different name or owner.'
        : 'Create your first project to start organising your team\'s work.'}
    </p>
    {!hasQuery && (
      <Link
        to="/projects/new"
        className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors shadow-md"
      >
        <Plus size={16} />
        Create project
      </Link>
    )}
  </div>
);

/* ---------- Page ---------- */
const ProjectsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<BackendProject[]>([]);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('project/get');
        if (response.data && Array.isArray(response.data.projects)) {
          setProjects(response.data.projects);
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error('Project fetch error:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.project_owner?.name?.toLowerCase().includes(q)
    );
  }, [searchQuery, projects]);

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden space-y-6 px-4 sm:px-10 lg:px-20 py-10 bg-white text-zinc-950">
      
      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Projects</h1>
          {/* ✅ Contrast Fixed: Count text color deepened to zinc-600 */}
          <p className="text-sm text-zinc-600 mt-1 font-medium">
            {loading ? (
              <span className="inline-block h-4 w-48 rounded bg-zinc-100 animate-pulse" />
            ) : (
              <>
                {projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace
              </>
            )}
          </p>
        </div>
        {user?.role !== 'employee' && (
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors shadow-md"
          >
            <Plus size={16} />
            New project
          </Link>
        )}
      </div>

      {/* ---------- Toolbar ---------- */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full max-w-sm">
          {/* ✅ Contrast Fixed: Icon and Input border given solid weights */}
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-white border border-zinc-300 pl-9 pr-3 py-2.5 text-sm text-zinc-950 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-sm"
          />
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap items-center gap-4 px-1">
          {(Object.entries(statusConfig) as [ProjectStatus, { dot: string; label: string }][]).map(
            ([, cfg]) => (
              <span key={cfg.label} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                {cfg.label}
              </span>
            )
          )}
        </div>
      </div>

      {/* ---------- Grid ---------- */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyGrid hasQuery={searchQuery.length > 0} />
      )}
    </div>
  );
};

export default ProjectsPage;