import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import FontSwitcher from './FontSwitcher';
import { Activity, Bell, LogOut, Search, Check, ShieldAlert, Sparkles, Command, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ mobileSidebarOpen, setMobileSidebarOpen }) => {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.includes('risk-center')) return 'Risk Center';
    if (path.includes('projects')) return 'Projects';
    if (path.includes('tasks')) return 'Tasks';
    if (path.includes('workload')) return 'Workload Analytics';
    if (path.includes('extensions')) return 'Extensions';
    if (path.includes('team')) return 'Team Roster';
    return 'Dashboard';
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Brand & Hamburger */}
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-slate-700 hover:text-slate-900 bg-slate-100 rounded-xl md:hidden transition"
          aria-label="Toggle Navigation Menu"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div
          onClick={() => navigate(isManager ? '/manager/dashboard' : '/employee/dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs group-hover:bg-slate-800 transition">
            <Activity className="w-4 h-4" />
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-base font-black tracking-tight text-slate-900">
              WorkRadar
            </span>
            <span className="text-slate-300 font-mono text-xs hidden sm:inline">/</span>
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">{getBreadcrumb()}</span>
          </div>
        </div>
      </div>

      {/* Desktop Search Bar */}
      <div className="hidden lg:flex items-center space-x-2 bg-slate-100/90 px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 w-72 xl:w-80">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="flex-1 text-slate-400 font-medium">Search tasks or risk scores...</span>
        <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-mono text-slate-500 shadow-2xs flex items-center space-x-0.5">
          <Command className="w-2.5 h-2.5" />
          <span>K</span>
        </kbd>
      </div>

      {/* Right Controls: Font Switcher, Notifications & Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <FontSwitcher />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 sm:p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-mono font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Drawer */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-72 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-slate-900" />
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-extrabold text-slate-800 hover:underline flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-4 text-xs transition ${
                        notif.isRead ? 'bg-white opacity-70' : 'bg-slate-50 border-l-4 border-slate-900'
                      }`}
                    >
                      <p className="font-extrabold text-slate-900 flex items-center space-x-1.5 mb-1">
                        {notif.type === 'RISK_ALERT' && <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                        <span>{notif.title}</span>
                      </p>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] font-mono text-slate-400 mt-1.5 block">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">No new notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-extrabold text-slate-900 leading-tight">{user?.name}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user?.role}</p>
          </div>

          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Logout"
            className="p-2 sm:p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
