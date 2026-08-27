import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { RefreshCw, Mail, Clock, Briefcase } from 'lucide-react';

const TeamPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get('/auth/users');
        if (response.data.success) {
          setUsers(response.data.users);
        }
      } catch (error) {
        console.error('Error fetching team users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
        <span className="text-sm font-medium">Loading team directory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Team Roster</h1>
        <p className="text-xs text-slate-500 mt-1">
          Engineering team members, designations, roles, and capacity settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {users.map((u) => (
          <div key={u._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center shadow-xs">
                {u.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{u.name}</h3>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                  {u.role}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
              <p className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-900 font-medium">{u.designation || 'Software Engineer'}</span>
              </p>
              <p className="flex items-center space-x-2 font-mono">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{u.email}</span>
              </p>
              <p className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Weekly Capacity: <strong className="text-slate-900">{u.weeklyCapacityHours || 40}h</strong></span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamPage;
