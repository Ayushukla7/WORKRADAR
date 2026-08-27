import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, AlertTriangle, RefreshCw } from 'lucide-react';

const WorkloadAnalyticsPage = () => {
  const [teamWorkload, setTeamWorkload] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkloadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/workload');
      if (response.data.success) {
        setTeamWorkload(response.data.teamWorkload);
      }
    } catch (error) {
      console.error('Error fetching workload analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkloadData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
        <span className="text-sm font-medium">Calculating team capacity load percentages...</span>
      </div>
    );
  }

  const overloadedEmployees = teamWorkload.filter((w) => w.workloadPercentage > 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-900 text-xs font-semibold mb-2">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Workforce Capacity Balancer</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Team Workload Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor assigned active task hours against weekly capacity to prevent employee burnout and delay risks.
        </p>
      </div>

      {/* Overload Alert Warning Box */}
      {overloadedEmployees.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex items-start space-x-3 text-xs text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-rose-900">
              Workload Overload Warning ({overloadedEmployees.length} Team Member(s))
            </h4>
            <p className="mt-1 leading-relaxed text-rose-700">
              {overloadedEmployees.map((e) => e.user.name).join(', ')} currently have allocated active task hours exceeding 100% of their weekly capacity. Consider reassigning upcoming sub-tasks to underloaded team members.
            </p>
          </div>
        </div>
      )}

      {/* Employee Capacity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {teamWorkload.map((w) => {
          const isOverloaded = w.workloadPercentage > 100;
          return (
            <div
              key={w.user._id}
              className={`bg-white rounded-2xl border p-6 shadow-xs flex flex-col justify-between space-y-4 ${
                isOverloaded ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                      {w.user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{w.user.name}</h3>
                      <p className="text-[10px] text-slate-500">{w.user.designation}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isOverloaded
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              </div>

              {/* Workload Progress Bar */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Capacity Utilized</span>
                  <span
                    className={`font-mono font-bold ${
                      isOverloaded ? 'text-rose-700' : 'text-slate-900'
                    }`}
                  >
                    {w.workloadPercentage}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      isOverloaded ? 'bg-rose-600' : 'bg-slate-900'
                    }`}
                    style={{ width: `${Math.min(100, w.workloadPercentage)}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-700 border-t border-slate-200 mt-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Active Tasks</span>
                    <span className="font-mono font-bold text-slate-900">{w.totalActiveTasks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Allocated Hours</span>
                    <span className="font-mono font-bold text-slate-900">
                      {w.totalEstimatedHours} / {w.weeklyCapacityHours}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Tasks List */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Tasks</p>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {w.activeTasks && w.activeTasks.length > 0 ? (
                    w.activeTasks.map((t) => (
                      <div
                        key={t._id}
                        className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-800 flex justify-between items-center"
                      >
                        <span className="truncate max-w-[160px] font-semibold">{t.title}</span>
                        <span className="font-mono text-slate-900 font-bold shrink-0">{t.estimatedHours}h</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-slate-400 italic p-1">No active tasks assigned</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkloadAnalyticsPage;
