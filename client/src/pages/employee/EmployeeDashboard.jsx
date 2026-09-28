import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RiskScoreBadge from '../../components/risk/RiskScoreBadge';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  AlertTriangle,
  RefreshCw,
  Sliders,
  UserCheck,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Zap
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const [tasksRes, workloadRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/workload/my'),
      ]);

      if (tasksRes.data.success) setTasks(tasksRes.data.tasks);
      if (workloadRes.data.success) setWorkload(workloadRes.data.workload);
    } catch (error) {
      console.error('Error fetching employee dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const handleQuickProgressUpdate = async (taskId, newProgress) => {
    try {
      await api.put(`/tasks/${taskId}`, { progressPercentage: newProgress });
      fetchEmployeeData();
    } catch (error) {
      alert('Failed to update progress');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="text-sm font-bold text-slate-700">Loading your workspace...</span>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const blockedTasks = tasks.filter((t) => t.isBlocked || t.status === 'BLOCKED');
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');

  const isOverloaded = (workload?.workloadPercentage || 0) > 100;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
            <Zap className="w-3.5 h-3.5 fill-indigo-600" />
            <span>Developer Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Track your assigned work, slide progress velocity, report blockers, and manage capacity.
          </p>
        </div>

        <button
          onClick={() => navigate('/employee/tasks')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-xs w-fit"
        >
          <CheckSquare className="w-4 h-4" />
          <span>Manage All My Tasks</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/employee/tasks')}
          className="bg-white border border-slate-200/90 hover:border-slate-300 p-5 rounded-2xl cursor-pointer transition shadow-2xs space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Tasks</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900 font-mono">{activeTasks.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{completedTasks.length} tasks completed</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/employee/tasks')}
          className="bg-white border border-slate-200/90 hover:border-amber-300 p-5 rounded-2xl cursor-pointer transition shadow-2xs space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Blocked Tasks</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-amber-600 font-mono">{blockedTasks.length}</p>
            <p className="text-[11px] text-amber-800 mt-0.5">Need resolution or assistance</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/employee/workload')}
          className="bg-white border border-slate-200/90 hover:border-indigo-300 p-5 rounded-2xl cursor-pointer transition shadow-2xs space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Weekly Capacity</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className={`text-3xl font-extrabold font-mono ${isOverloaded ? 'text-rose-600' : 'text-slate-900'}`}>
              {workload?.workloadPercentage || 0}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {workload?.totalEstimatedHours || 0} / {workload?.weeklyCapacityHours || 40} hours allocated
            </p>
          </div>
        </div>
      </div>

      {/* Quick Progress Updates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-extrabold text-slate-900">Active Tasks & Progress Velocity</h2>
          </div>
          <button
            onClick={() => navigate('/employee/tasks')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {activeTasks.length > 0 ? (
            activeTasks.map((task) => {
              const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo].filter(Boolean);
              return (
                <div
                  key={task._id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{task.title}</h3>
                      <p className="text-xs text-slate-600 font-medium mt-0.5 flex items-center flex-wrap gap-1.5">
                        <span>Project: <strong className="text-slate-900 font-bold">{task.projectId?.name || 'N/A'}</strong></span>
                        <span>•</span>
                        <span>Due: <strong className="font-mono text-slate-900 font-bold">{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</strong></span>
                        {assignees.length > 1 && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[10px]">
                            Co-assigned ({assignees.map((u) => u.name).join(', ')}) • Split: {Math.round((task.estimatedHours / assignees.length) * 10) / 10}h
                          </span>
                        )}
                      </p>
                    </div>

                    <RiskScoreBadge score={task.riskScore} level={task.riskLevel} size="sm" />
                  </div>

                  {/* Blocker Banner */}
                  {task.isBlocked && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Task is Currently Blocked:</span>
                        <p className="text-slate-700 font-medium mt-0.5">{task.blockerReason || 'Reason unspecified'}</p>
                      </div>
                    </div>
                  )}

                  {/* Progress Slider */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 font-bold">Update Velocity Percentage</span>
                      <span className="font-mono text-indigo-700 font-extrabold text-sm">{task.progressPercentage}%</span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={task.progressPercentage}
                      onChange={(e) => handleQuickProgressUpdate(task._id, Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 font-medium">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <span>No active tasks assigned to you currently. You are all caught up!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
