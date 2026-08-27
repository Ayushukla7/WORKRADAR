import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RiskScoreBadge from '../../components/risk/RiskScoreBadge';
import RiskBreakdownCard from '../../components/risk/RiskBreakdownCard';
import { ShieldAlert, AlertTriangle, RefreshCw, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RiskCenterPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('ALL');

  const fetchRiskCenterData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/risk/tasks');
      if (response.data.success) {
        setTasks(response.data.tasks);
        if (response.data.tasks.length > 0) {
          setSelectedTask(response.data.tasks[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching risk center tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskCenterData();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (filterLevel === 'ALL') return true;
    if (filterLevel === 'HIGH_CRITICAL') return t.riskScore >= 65;
    if (filterLevel === 'BLOCKED') return t.isBlocked || t.status === 'BLOCKED';
    return t.riskLevel === filterLevel;
  });

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
        <span className="text-sm font-medium">Running Delay Risk Engine recalculations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Rule-Based Delay Forecasting Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Predictive Delay Risk Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Calculated score (0-100) evaluating pace deficit, blocker presence, dependency graph, and workload pressure.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setFilterLevel('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterLevel === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Active ({tasks.length})
          </button>
          <button
            onClick={() => setFilterLevel('HIGH_CRITICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterLevel === 'HIGH_CRITICAL' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            High Risk ({tasks.filter((t) => t.riskScore >= 65).length})
          </button>
          <button
            onClick={() => setFilterLevel('BLOCKED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterLevel === 'BLOCKED' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Blocked ({tasks.filter((t) => t.isBlocked || t.status === 'BLOCKED').length})
          </button>
        </div>
      </div>

      {/* Main 2-Column Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Task Delay Rankings ({filteredTasks.length})
          </h3>

          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const isSelected = selectedTask?._id === task._id;
                return (
                  <div
                    key={task._id}
                    onClick={() => setSelectedTask(task)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-white border-slate-900 shadow-md ring-1 ring-slate-900/10'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{task.title}</h4>
                      <RiskScoreBadge score={task.riskScore} level={task.riskLevel} size="sm" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{task.projectId?.name || 'Project'}</span>
                      <span className="font-mono text-slate-900 font-bold">{task.progressPercentage}% done</span>
                    </div>

                    {task.isBlocked && (
                      <div className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center space-x-1 w-fit">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>BLOCKED: {task.blockerReason || 'Unspecified'}</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                No tasks match the selected risk filter level.
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Diagnostic Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTask ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Diagnostic Breakdown Inspector
                </h3>
                <button
                  onClick={() => navigate(`/manager/tasks/${selectedTask._id}`)}
                  className="text-xs font-bold text-slate-900 hover:underline flex items-center space-x-1"
                >
                  <span>Edit / Reassign Task</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <RiskBreakdownCard task={selectedTask} />
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              Select a task from the list to view its complete delay risk diagnostic report.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskCenterPage;
