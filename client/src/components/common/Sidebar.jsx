import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  ShieldAlert,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  Clock,
  UserCheck,
  Zap
} from 'lucide-react';

const Sidebar = () => {
  const { isManager, user } = useAuth();

  const managerLinks = [
    { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/risk-center', label: 'Risk Center', icon: ShieldAlert, badge: 'RISK' },
    { to: '/manager/projects', label: 'Projects', icon: FolderKanban },
    { to: '/manager/tasks', label: 'All Tasks', icon: CheckSquare },
    { to: '/manager/workload', label: 'Team Workload', icon: BarChart3 },
    { to: '/manager/extensions', label: 'Extensions', icon: Clock },
    { to: '/manager/team', label: 'Team Members', icon: Users },
  ];

  const employeeLinks = [
    { to: '/employee/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/employee/tasks', label: 'My Tasks', icon: CheckSquare },
    { to: '/employee/workload', label: 'My Workload', icon: UserCheck },
    { to: '/employee/extensions', label: 'My Extensions', icon: Clock },
  ];

  const links = isManager ? managerLinks : employeeLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black text-slate-900 truncate">{user?.name}</p>
            <p className="text-[10px] font-bold text-slate-500 truncate">{user?.designation || user?.role}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Workspace</p>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-slate-900 text-white font-extrabold shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[9px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1.5 shadow-xs">
        <div className="flex items-center space-x-1.5 font-black text-xs text-slate-100">
          <Zap className="w-3.5 h-3.5 fill-white text-white" />
          <span>WorkRadar Engine</span>
        </div>
        <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
          "Don't tell managers a task is late. Tell them it's likely to become late."
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
