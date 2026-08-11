import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, Plus, FolderKanban, FolderPlus, UserPlus, BellOff } from 'lucide-react';
import { useAppSelector } from '../hooks/storeHooks';
import { normalizeRole } from '../config/permissions';
import logo from "../assets/logow.png";
import ProjectDropdown from './ProjectDropdown';
import ProfileDropdown from './ProfileDropdown';
import { Link, useNavigate } from 'react-router-dom';

// ── "New" quick-create menu — only actions the current role is actually allowed to hit ──
const NewMenu = ({ canManage }: { canManage: boolean }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Employees currently have no global "create" destination (project creation &
  // invites are owner/manager-only routes) — so hide the button entirely for them
  // instead of showing a menu that always fails with /unauthorized.
  if (!canManage) return null;

  const items = [
    { label: 'New project', icon: FolderPlus, to: '/projects/new' },
    { label: 'Invite member', icon: UserPlus, to: '/invite' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-200"
      >
        <Plus size={16} /> <span className="hidden sm:inline">New</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-48 border border-zinc-200 bg-white rounded-xl shadow-lg overflow-hidden">
          {items.map(({ label, icon: Icon, to }) => (
            <button
              key={to}
              onClick={() => { navigate(to); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
            >
              <Icon size={15} className="text-zinc-400" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Notifications — placeholder dropdown until a notifications API/route exists ──
const NotificationsMenu = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="p-2.5 rounded-xl border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-200"
      >
        <Bell size={18} className="text-zinc-600" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 border border-zinc-200 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-sm font-semibold text-zinc-950">Notifications</p>
          </div>
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <BellOff size={18} className="text-zinc-300 mb-2" />
            <p className="text-xs text-zinc-500">No notifications yet.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const TopBar = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [isProjectOpen, setIsProjectOpen] = useState(false);

  const role = normalizeRole(user?.role);
  const canManage = role === 'owner' || role === 'manager';

  return (
    <header className="relative z-40 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-5 shadow-sm">
      <div className="flex items-center gap-2.5 pr-2">
        <Link to="/dashboard">
          <img src={logo} alt="Logo" className="w-8" />
        </Link>
      </div>

      {/* Projects Dropdown Trigger */}
      <div className="relative">
        <button
          onClick={() => setIsProjectOpen(!isProjectOpen)}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-950 px-3 py-1.5 rounded-lg border border-transparent hover:border-zinc-200 hover:bg-zinc-50 transition-all duration-200"
        >
          <FolderKanban size={18} />
          <span className="font-semibold text-sm">Projects</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${isProjectOpen ? 'rotate-180' : ''}`} />
        </button>
        <ProjectDropdown isOpen={isProjectOpen} onClose={() => setIsProjectOpen(false)} />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 sm:gap-3">
        <NewMenu canManage={canManage} />
        <NotificationsMenu />
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-zinc-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-zinc-950 capitalize">{user?.name || 'User'}</p>
            <p className="text-[10px] text-zinc-500 font-medium capitalize">{user?.role || 'Member'}</p>
          </div>
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default TopBar;