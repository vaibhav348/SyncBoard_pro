import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Settings, Bell, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/storeHooks';
import { logoutUser } from '../features/auth/authSlice';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const dummyuser = {
    name: 'vaibhav pandey',
    email: 'vaibhav.pandey@briskcovey.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button (Avatar Image) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center focus:outline-none transition-transform duration-200 active:scale-95"
      >
        <img
          src={dummyuser.avatar}
          alt={user?.name}
          className="h-10 w-10 rounded-full object-cover border-2 border-zinc-200 hover:border-zinc-400 transition-colors duration-200"
        />
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl z-50">

          {/* User Profile Section */}
          <div className="flex items-start gap-3 pb-3.5">
            <img
              src={dummyuser.avatar}
              alt={user?.name}
              className="h-12 w-12 rounded-full object-cover border border-zinc-200"
            />
            <div className="space-y-0.5 min-w-0 flex-1">
              <h4 className="text-sm font-bold text-zinc-950 capitalize truncate">
                {user?.name}
              </h4>
              <p className="text-xs text-zinc-500 font-medium truncate">
                {user?.email}
              </p>
              <button
                onClick={() => { navigate('/settings/profile'); setIsOpen(false); }}
                className="text-xs font-semibold text-zinc-900 hover:underline pt-1 block"
              >
                Edit profile
              </button>
            </div>
          </div>

          <hr className="border-zinc-100 mb-2" />

          {/* Navigation Links */}
          <div className="space-y-0.5">
            <button
              onClick={() => { navigate('/plans'); setIsOpen(false); }}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 transition-colors duration-200"
            >
              <CreditCard size={16} className="text-zinc-500" />
              Paid Plans
            </button>

            <button
              onClick={() => { navigate('/settings'); setIsOpen(false); }}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 transition-colors duration-200"
            >
              <Settings size={16} className="text-zinc-500" />
              Account settings
            </button>

            <button
              onClick={() => { navigate('/notifications'); setIsOpen(false); }}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 transition-colors duration-200"
            >
              <Bell size={16} className="text-zinc-500" />
              Notifications
            </button>
          </div>

          <hr className="border-zinc-100 my-2" />

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut size={16} />
            Logout
          </button>

        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;