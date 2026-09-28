import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RiskScoreBadge from '../../components/risk/RiskScoreBadge';
import TiltCard3D from '../../components/common/TiltCard3D';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  AlertTriangle,
  RefreshCw,
  Sliders,
  UserCheck
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
      <div className="py-20 flex items-center justify-center space-x-3 text-slate-800">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-700" />
        <span className="text-sm font-extrabold">Loading your workspace...</span>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const blockedTasks = tasks.filter((t) => t.isBlocked || t.status === 'BLOCKED');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back, {user?.name} 👋</h1>
          <p className="text-xs text-slate-700 font-bold mt-1 leading-relaxed">
            Track your assigned work, update progress velocity, and report blockers.
          </p>
        </div>

        <button
          onClick={() => navigate('/employee/tasks')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition flex items-center space-x-2 shadow-xs w-fit"
        >
          <CheckSquare className="w-4 h-4" />
          <span>Manage My Tasks</span>
        </button>
      </div>

      {/* Overview Cards with 3D Tilt */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TiltCard3D className="card-soft p-5 border border-indigo-100">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">My Active Tasks</span>
            <CheckSquare className="w-4.5 h-4.5 text-indigo-700" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">{activeTasks.length}</p>
        </TiltCard3D>

        <TiltCard3D className="card-soft p-5 border border-amber-100">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">My Blocked Tasks</span>
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-amber-700 font-mono">{blockedTasks.length}</p>
        </TiltCard3D>

        <TiltCard3D className="card-soft p-5 border border-purple-100">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Current Workload</span>
            <UserCheck className="w-4.5 h-4.5 text-indigo-700" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-mono">
            {workload?.workloadPercentage || 0}%
          </p>
          <p className="text-[11px] text-slate-700 font-bold mt-1">
            {workload?.totalEstimatedHours || 0} hours assigned
          </p>
        </TiltCard3D>
      </div>

      {/* Quick Progress Updates Section */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-700" />
          <span>Quick Progress Updates</span>
        </h2>

        <div className="space-y-3">
          {activeTasks.length > 0 ? (
            activeTasks.map((task) => (
              <div
                key={task._id}
                className="card-soft p-5 space-y-3 border border-slate-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{task.title}</h3>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5 flex items-center flex-wrap gap-1.5">
                      <span>Project: <strong className="text-slate-900 font-extrabold">{task.projectId?.name || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Due: <strong className="font-mono text-slate-900 font-bold">{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</strong></span>
                      {Array.isArray(task.assignedTo) && task.assignedTo.length > 1 && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[10px]">
                          Co-assigned ({task.assignedTo.map((u) => u.name).join(', ')}) • Split Effort: {Math.round((task.estimatedHours / task.assignedTo.length) * 10) / 10}h
                        </span>
                      )}
                    </p>
                  </div>

                  <RiskScoreBadge score={task.riskScore} level={task.riskLevel} size="sm" />
                </div>

                {/* Blocker Banner */}
                {task.isBlocked && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-amber-900">Task is Currently Blocked:</span>
                      <p className="text-slate-800 font-medium mt-0.5">{task.blockerReason || 'Reason unspecified'}</p>
                    </div>
                  </div>
                )}

                {/* Progress Slider */}
                <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-800 font-extrabold">Update Velocity Progress</span>
                    <span className="font-mono text-indigo-700 font-extrabold text-sm">{task.progressPercentage}%</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={task.progressPercentage}
                    onChange={(e) => handleQuickProgressUpdate(task._id, Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-xs text-slate-700 font-semibold card-soft">
              No active tasks assigned to you currently.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
