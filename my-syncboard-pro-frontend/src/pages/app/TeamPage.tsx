import { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import AddProjectMemberModal from '../../components/Invite/AddProjectMemberModal';
import DepartmentFilterSidebar from '../../components/DepartmentFilterSidebar';
import TeamTable from '../../components/TeamTable';
import type { CompanyMember } from '../../types/invite.types';
import { type DepartmentOption } from '../../config/departments';
import { useAppDispatch, useAppSelector } from '../../hooks/storeHooks';
import axiosInstance from '../../api/axiosInstance';
import { setActiveProjectSuccess, type ActiveProjectData } from '../../features/activeProject/activeProjectSlice';
const lightMode = {
  '--color-bg': '#ffffff',
  '--color-text': '#27272a',
  '--color-text-h': '#09090b',
  '--color-border': '#e4e4e7',
  '--color-accent': '#18181b',
  '--color-accent-bg': '#f4f4f5',
} as React.CSSProperties;
type Role = 'ALL' | 'owner' | 'manager' | 'employee';
const ROLES: Role[] = ['ALL', 'owner', 'manager', 'employee'];

type TeamPageMember = CompanyMember & { isOwner?: boolean };

  (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const TeamPage = () => {
  const dispatch = useAppDispatch();
  const { projectId } = useParams<{ projectId?: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const { data: activeProject } = useAppSelector((state) => state.activeProject);

  const [searchQuery, setSearchQuery] = useState('');
  const [team, setTeam] = useState<TeamPageMember[]>([]);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [activeFilter, setActiveFilter] = useState<Role>('ALL');
  const [activeDepartment, setActiveDepartment] = useState<DepartmentOption | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const normalizedRole = user?.role?.toLowerCase();
  const canManageTeam =
    normalizedRole === 'owner' ||
    normalizedRole === 'manager' ||
    normalizedRole === 'superadmin';

  const buildTeamFromProject = (projectData: ActiveProjectData): TeamPageMember[] => {
    const members = projectData.members ?? [];
    const owner = projectData.project_owner;
    const normalized: TeamPageMember[] = members.map((m) => ({
      id: m._id,
      name: m.name,
      email: m.email,
      title: m.title ?? '',
      role: (m.role as TeamPageMember['role']) ?? 'employee',
      department: m.department,
      projects: [projectData.name ?? ''],
      isOwner: m._id === owner?._id,
    }));

    const ownerAlreadyInTeam = normalized.some((m) => m.id === owner?._id);
    if (!ownerAlreadyInTeam && owner) {
      normalized.unshift({
        id: owner._id,
        name: owner.name,
        email: owner.email,
        title: owner.title ?? '',
        role: (owner.role as TeamPageMember['role']) ?? 'owner',
        department: owner.department,
        projects: [projectData.name ?? ''],
        isOwner: true,
      });
    }

    return normalized;
  };

  useEffect(() => {
    const activeId = projectId ?? activeProject?._id;
    if (!activeId) return;

    const fetchTeam = async () => {
      setLoading(true);
      try {
        const projectResponse = await axiosInstance.get<{ project?: ActiveProjectData }>(`/project/${activeId}`);
        const projectData = projectResponse.data?.project;

        if (projectData) {
          dispatch(setActiveProjectSuccess(projectData));
          setTeam(buildTeamFromProject(projectData));
        }

        if (canManageTeam) {
          const usersResponse = await axiosInstance.get<{
            allUsers?: Array<{ _id: string; name: string; email: string; role: string; title?: string; department?: string }>;
          }>('/auth/users');

          const roster = usersResponse.data?.allUsers ?? [];
          setCompanyMembers(
            roster.map((u) => ({
              id: u._id,
              name: u.name,
              email: u.email,
              role: (u.role as CompanyMember['role']) ?? 'employee',
              title: u.title ?? '',
              department: u.department,
              projects: [],
            }))
          );
        } else {
          setCompanyMembers([]);
        }
      } catch (error) {
        console.error('Team fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchTeam();
  }, [activeProject?._id, canManageTeam, dispatch, projectId]);

  const filteredTeam = useMemo(() => {
    return team.filter((member) => {
      console.log("member", member);

      const name = member.name?.toLowerCase() ?? '';
      const role = member.role?.toLowerCase() ?? '';
      const dept = member.department?.toLowerCase() ?? '';
      const title = member.title?.toLowerCase() ?? '';

      const matchesSearch =
        name.includes(searchQuery.toLowerCase()) ||
        role.includes(searchQuery.toLowerCase()) ||
        dept.includes(searchQuery.toLowerCase());
      title.includes(searchQuery.toLowerCase());

      const matchesRole = activeFilter === 'ALL' || role === activeFilter.toLowerCase();
      const matchesDept = activeDepartment === 'ALL' || dept === activeDepartment.toLowerCase();

      return matchesSearch && matchesRole && matchesDept;
    });
  }, [searchQuery, activeFilter, activeDepartment, team]);

  const availableMembers = companyMembers.filter(
    (cm) => !team.some((tm) => tm.id === cm.id)
  );

  const handleAddMember = async (memberId: string) => {
    const activeId = projectId ?? activeProject?._id;
    if (!activeId || isAddingMember) return;

    setIsAddingMember(true);
    try {
      await axiosInstance.post(`/project/${activeId}/members`, { memberId });
      const refreshed = await axiosInstance.get<{ project?: ActiveProjectData }>(`/project/${activeId}`);
      const projectData = refreshed.data?.project;
      if (!projectData) return;

      dispatch(setActiveProjectSuccess(projectData));
      setTeam(buildTeamFromProject(projectData));
    } catch (error) {
      console.error('Unable to add member to project:', error);
      throw error;
    } finally {
      setIsAddingMember(false);
    }
  };

  return (
    <div style={lightMode} className="space-y-5 bg-bg min-h-full py-4 px-8 min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-h">Team</h1>

          {
            canManageTeam ?
              <p className="text-sm text-text/60 mt-1">
                Add members to your project to get started.
              </p>
              :
              <p className="text-sm text-text/60 mt-1">
                Your team for this project.
              </p>
          }
        </div>

        {canManageTeam && (
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isAddingMember}
            className="inline-flex items-center gap-2 bg-accent text-bg text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-85 transition-opacity"
          >
            <UserPlus size={15} />
            {isAddingMember ? 'Adding...' : 'Add member'}
          </button>
        )}

      </div>


      <div className="flex flex-wrap  gap-5   bg-bg">

        {/* ── Left Sidebar: Filters ─────────────────────────── */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sticky top-6 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Filters</h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors duration-200"
                />
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Role filter */}
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-slate-900 px-1">Role</p>
              <div className="space-y-0.5">
                {ROLES.map((role) => {
                  const isActive = activeFilter === role;
                  return (
                    <button
                      key={role}
                      onClick={() => setActiveFilter(role)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${isActive
                          ? 'bg-slate-900 text-white font-medium'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                      <span className="capitalize">{role === 'ALL' ? 'All roles' : role}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Department filter */}
            <DepartmentFilterSidebar
              activeDepartment={activeDepartment}
              onSelectDepartment={setActiveDepartment}
            />
          </div>
        </aside>

        {/* ── Right Content ─────────────────────────────────── */}
        <main className="flex-1 min-w-0 space-y-5">



          {/* ── Team table ───────────────────────────────────── */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={15} className="animate-spin text-slate-400" />
                Loading project team...
              </div>
            </div>
          ) : (
            <TeamTable
              title={`Project roster · ${filteredTeam.length} member${filteredTeam.length !== 1 ? 's' : ''}`}
              members={filteredTeam.map((m) => ({
                id: m.id,
                name: m.name,
                email: m.email,
                role: m.role,
                department: m.department,
                title: m.title,
                isOwner: m.isOwner,
              }))}
              emptyMessage="No members match the current filters."

              currentUserId={user?.id}
            />
          )}
        </main>
      </div>

      {canManageTeam && (
        <AddProjectMemberModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          availableMembers={availableMembers}
          onAdd={handleAddMember}
        />
      )}
    </div>
  );
};

export default TeamPage;