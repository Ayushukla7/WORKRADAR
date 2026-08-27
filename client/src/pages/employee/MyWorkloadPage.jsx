import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { UserCheck, RefreshCw, AlertTriangle } from 'lucide-react';

const MyWorkloadPage = () => {
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkload = async () => {
      setLoading(true);
      try {
        const response = await api.get('/workload/my');
        if (response.data.success) {
          setWorkload(response.data.workload);
        }
      } catch (error) {
        console.error('Error fetching personal workload:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkload();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
        <span className="text-sm font-medium">Calculating your workload stats...</span>
      </div>
    );
  }

  const isOverloaded = workload?.workloadPercentage > 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Workload Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your capacity utilization and active task effort allocations.
        </p>
      </div>

      <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{workload?.user?.name}</h3>
              <p className="text-xs text-slate-500">{workload?.user?.designation}</p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isOverloaded
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {workload?.status}
          </span>
        </div>

        {/* Capacity Bar */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600 font-semibold">Weekly Capacity Utilized</span>
            <span className={`font-mono font-bold ${isOverloaded ? 'text-rose-700' : 'text-slate-900'}`}>
              {workload?.workloadPercentage}%
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full ${isOverloaded ? 'bg-rose-600' : 'bg-slate-900'}`}
              style={{ width: `${Math.min(100, workload?.workloadPercentage || 0)}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-700 border-t border-slate-200 mt-2">
            <div>
              <span className="text-[10px] text-slate-500 block">Total Active Tasks</span>
              <span className="font-mono font-bold text-slate-900">{workload?.totalActiveTasks}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Estimated Active Effort</span>
              <span className="font-mono font-bold text-slate-900">
                {workload?.totalEstimatedHours} / {workload?.weeklyCapacityHours} hours
              </span>
            </div>
          </div>
        </div>

        {isOverloaded && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p>
              Your active task assignments exceed 100% of your weekly capacity. Consider speaking with your manager to reassign lower priority tasks or request deadline extensions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWorkloadPage;
