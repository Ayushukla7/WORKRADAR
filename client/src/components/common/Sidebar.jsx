import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  AlertTriangle,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  Clock,
  UserCheck,
  Radar,
  X
} from 'lucide-react';

const Sidebar = ({ mobileSidebarOpen, setMobileSidebarOpen }) => {
  const { isManager, user } = useAuth();
  const location = useLocation();

  // Auto-close mobile drawer on route change
  useEffect(() => {
    if (mobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  }, [location.pathname]);

  const managerSections = [
    {
      title: 'OVERVIEW',
      links: [
        { to: '/manager/dashboard', label: 'Command Center', icon: LayoutDashboard },
        { to: '/manager/risk-center', label: 'Risk Radar', icon: AlertTriangle },
      ],
    },
    {
      title: 'EXECUTION',
      links: [
        { to: '/manager/tasks', label: 'Tasks & Sprints', icon: CheckSquare },
        { to: '/manager/projects', label: 'Projects Portfolio', icon: FolderKanban },
      ],
    },
    {
      title: 'TEAM & OPERATIONS',
      links: [
        { to: '/manager/workload', label: 'Capacity & Workload', icon: BarChart3 },
        { to: '/manager/extensions', label: 'Blockers & Requests', icon: Clock },
        { to: '/manager/team', label: 'Team Members', icon: Users },
      ],
    },
  ];

  const employeeSections = [
    {
      title: 'MY WORKSPACE',
      links: [
        { to: '/employee/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { to: '/employee/tasks', label: 'My Tasks', icon: CheckSquare },
      ],
    },
    {
      title: 'MY CAPACITY',
      links: [
        { to: '/employee/workload', label: 'My Workload', icon: UserCheck },
        { to: '/employee/extensions', label: 'My Requests', icon: Clock },
      ],
    },
  ];

  const sections = isManager ? managerSections : employeeSections;

  return (
    <>
      {/* Mobile Dark Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:static top-0 left-0 bottom-0 z-50 md:z-auto
          w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 min-h-screen md:min-h-[calc(100vh-57px)]
          transform transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="space-y-6">
          {/* Mobile Header with Close Button */}
          <div className="flex items-center justify-between md:hidden border-b border-slate-100 pb-3">
            <span className="text-sm font-extrabold text-slate-900">WorkRadar Navigation</span>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[10px] font-semibold text-slate-500 truncate">{user?.designation || user?.role}</p>
            </div>
          </div>

          {/* Organized Navigation Groups */}
          <div className="space-y-5">
            {sections.map((sec) => (
              <div key={sec.title}>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-1.5">
                  {sec.title}
                </p>
                <nav className="space-y-1">
                  {sec.links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                          }`
                        }
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{link.label}</span>
                        </div>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Brand Banner */}
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl space-y-1 shadow-xs mt-6 md:mt-0">
          <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-100">
            <Radar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>WorkRadar Workspace</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            Predictive delay forecasting & workload capacity balancing.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
