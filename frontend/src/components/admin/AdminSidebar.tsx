import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Users,
  FolderTree,
  BarChart3,
  LogOut,
  Clock,
  ArrowLeft,
  GraduationCap
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Pending Reviews', path: '/admin/stories/pending', icon: Clock },
    { label: 'All Stories', path: '/admin/stories', icon: BookOpen },
    { label: 'Create Story', path: '/admin/stories/create', icon: PlusCircle },
    { label: 'Alumni Records', path: '/admin/members', icon: GraduationCap },
    { label: 'User Accounts', path: '/admin/users', icon: Users },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 }
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-full lg:w-64 bg-white rounded-lg p-5 shadow-xs border border-slate-200 shrink-0 h-fit">
      
      {/* Top Branding */}
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-200">
        <Logo size={36} />
        <div>
          <h3 className="text-xs font-bold text-primary tracking-tight leading-tight">
            ADMINISTRATION
          </h3>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
            Institutional Control
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="space-y-1 mb-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all duration-150 ${
                active
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-primary-soft hover:text-primary'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-purple-100' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Return to Public Site */}
      <div className="pt-4 border-t border-slate-200 space-y-1">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:bg-primary-soft hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span>Public Alumni Site</span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
