import { useEffect, useMemo, useState } from 'react';
import { History, Bookmark, Search, BookOpenText, Users, ChevronsLeft, ChevronsRight, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAppDispatch, useAppSelector } from '../hooks/storeHooks';
import { setActiveProjectFailure, setActiveProjectStart, setActiveProjectSuccess } from '../features/activeProject/activeProjectSlice';

import { openCreateSprint, setActiveSprint } from '../features/activeScrum/scrumSlice';
import { usePermissions } from '../hooks/usePermissions';
 

const Sidebar = () => {
    const { hasPermission } = usePermissions();
  
  const { sprints } = useAppSelector(state => state.scrum);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { projectId } = useParams<{ projectId?: string }>();
  const { data: activeProject } = useAppSelector((state) => state.activeProject);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScrumOpen, setIsScrumOpen] = useState(true); // Control Scrum dropdown
  const canCreateSprint = hasPermission('sprint.create');

  const resolvedProjectId = projectId ?? activeProject?._id;

  useEffect(() => {
    if (!resolvedProjectId || activeProject?._id === resolvedProjectId) return;

    let isMounted = true;

    const fetchProject = async () => {
      dispatch(setActiveProjectStart());
      try {
        const response = await axiosInstance.get(`/project/${resolvedProjectId}`);
        const project = response.data?.project;
        if (isMounted && project) {
          dispatch(setActiveProjectSuccess(project));
        }
      } catch (error) {
        if (isMounted) {
          dispatch(setActiveProjectFailure('Unable to load project details.'));
        }
      }
    };

    void fetchProject();
    return () => { isMounted = false; };
  }, [activeProject?._id, dispatch, resolvedProjectId]);

  const projectBasePath = useMemo(() => {
    return resolvedProjectId ? `/projects/${resolvedProjectId}` : '/projects';
  }, [resolvedProjectId]);

  const isExactProjectRoot = location.pathname === projectBasePath;

  const bottomNavItems = useMemo(
    () => [
      { name: 'Search', path: `${projectBasePath}/search`, icon: Search },
      
      { name: 'Team', path: `${projectBasePath}/team`, icon: Users },
    ],
    [projectBasePath]
  );
  const {  activeSprint } = useAppSelector(state => state.scrum);
  const isActivePath = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const projectDisplayName = activeProject?.name?.trim() || (resolvedProjectId ? 'Project' : 'Workspace');
  const projectInitial = projectDisplayName.charAt(0).toUpperCase();

  return (
    <aside className={`hidden h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-white md:flex transition-all duration-200 ${isCollapsed ? 'w-20' : 'w-56'}`}>
      {/* Project Brand Header */}
      <div className={`flex h-16 items-center transition-colors duration-200 ${isCollapsed ? 'justify-center' : 'justify-between '} border-b border-zinc-200 ${isExactProjectRoot ? 'bg-zinc-50 border-l-2 border-l-zinc-900' : 'hover:bg-zinc-50'}`}>
        <Link to={projectBasePath} className={`h-full px-4 w-full flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white shadow-sm">
            {projectInitial}
          </span>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-semibold tracking-tight text-zinc-950 truncate max-w-[120px]">{projectDisplayName}</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Team workspace</p>
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation links */}
      <div className="flex-1 px-3 py-3 overflow-y-auto space-y-3 select-none
      
        
        [&::-webkit-scrollbar]:w-1 
        [&::-webkit-scrollbar-track]:bg-transparent 
        [&::-webkit-scrollbar-thumb]:bg-slate-200 
        [&::-webkit-scrollbar-thumb]:rounded-full 
        hover:[&::-webkit-scrollbar-thumb]:bg-slate-300
      ">
        <div>
          <nav className="space-y-1">
            {/* 1. SCRUM ACCORDION TRIGGER */}
            <div className="group/scrum ">
              <button
                onClick={() => {
                  if (isCollapsed) setIsCollapsed(false);
                  setIsScrumOpen((prev) => !prev);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all duration-200 ease-out ${isActivePath(`${projectBasePath}/backlog`) || isActivePath(`${projectBasePath}/board`)
                    ? 'bg-zinc-100/80 text-zinc-950 font-medium'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                <History size={16} className={`transition-colors duration-200 ${isActivePath(`${projectBasePath}/backlog`) || isActivePath(`${projectBasePath}/board`) ? 'text-zinc-950' : 'text-zinc-400 group-hover/scrum:text-zinc-600'
                  }`} />
                {!isCollapsed && <span className="font-medium tracking-tight">Scrum</span>}
                {!isCollapsed && (
                  <div className="ml-auto text-zinc-400 group-hover/scrum:text-zinc-600 transition-transform duration-200">
                    {isScrumOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                )}
              </button>

              {/* Nested Sub-links Panel */}
              {isScrumOpen && !isCollapsed && (
                <div className="mt-1 ml-4 pl-2 border-l border-zinc-200 space-y-0.5 transition-all duration-300
               
                ">
                  {/* Backlog Link */}
                  <Link
                    to={`${projectBasePath}/backlog`}
                    className={`block px-3 py-1.5 text-[13px] rounded-md font-medium transition-all duration-150 ease-in-out ${location.pathname === `${projectBasePath}/backlog`
                        ? 'bg-zinc-50 text-black'
                        : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50/50'
                      }`}
                  >
                    Backlog
                  </Link>

                  {/* Dynamic Sprints Map */}
                  {sprints.map((sprint) => {
                    const sprintUrl = `${projectBasePath}/board?sprintId=${sprint._id}`;
                    // const isSelected = location.search.includes(`sprintId=${sprint._id}`);
                    const isSelected = activeSprint?._id === sprint._id; 

                    return (
                      <Link
                        key={sprint._id}
                        to={sprintUrl}
                        onClick={() => dispatch(setActiveSprint(sprint))}
                        className={`flex items-center justify-between px-3 py-1.5 text-[13px] rounded-md font-medium transition-all duration-150 ease-in-out ${isSelected
                            ? 'bg-black text-white shadow-[0_1px_1px_rgba(0,0,0,0.01)]'
                            : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50/50'
                          }`}
                      >
                        <span className="truncate max-w-[130px]">{sprint.name}</span>
                        {isSelected && (
                          <span className="relative flex h-1.5 w-1.5 shrink-0 ml-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-90" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                          </span>
                        )}
                      </Link>
                    );
                  })}

                  {
                    canCreateSprint &&
 
                      <button
                     onClick={() => dispatch(openCreateSprint())}
                    className="flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-zinc-400 border border-dashed border-transparent hover:border-zinc-200 hover:bg-white hover:text-zinc-700 rounded-md transition-all duration-200 group/btn mt-1.5"
                  >
                    <Plus size={13} className="text-zinc-400 group-hover/btn:text-zinc-600 transition-transform duration-200 group-hover/btn:rotate-90" />
                    <span>Create new sprint</span>
                  </button>
}
                </div>
              )}
            </div>

            {/* 2. REGULAR ISSUES LINK */}
            <Link
              to={`${projectBasePath}/issues`}
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all duration-200 ease-out ${isActivePath(`${projectBasePath}/issues`)
                  ? 'bg-zinc-100/80 text-zinc-950 font-medium'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Bookmark size={16} className={isActivePath(`${projectBasePath}/issues`) ? 'text-zinc-950' : 'text-zinc-400'} />
              {!isCollapsed && <span className="font-medium tracking-tight">Issues</span>}
            </Link>
          </nav>
        </div>
      </div>

      {/* Bottom Fixed Navigation Section */}
      <div className="border-t border-zinc-200 p-3 space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${active ? 'border border-zinc-200 bg-zinc-100 text-zinc-950 shadow-sm' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon size={18} className={active ? 'text-zinc-900' : 'text-zinc-400'} />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* Bottom Collapse Button */}
      <div className="border-t border-zinc-200 p-3">
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-zinc-600 transition-all duration-200 hover:bg-zinc-50 hover:text-zinc-950 ${isCollapsed ? 'justify-center px-2' : 'justify-between'}`}
        >
          {!isCollapsed && <span className="font-medium">Collapse menu</span>}
          {isCollapsed ? <ChevronsRight size={16} className="text-zinc-500" /> : <ChevronsLeft size={16} className="text-zinc-500" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;