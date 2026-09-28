import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RiskScoreBadge from '../../components/risk/RiskScoreBadge';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Plus,
  FolderKanban,
  CheckSquare,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalActive: 0,
    completed: 0,
    atRisk: 0,
    overdue: 0,
    blocked: 0,
  });
  const [atRiskTasks, setAtRiskTasks] = useState([]);
  const [pendingCompletionsCount, setPendingCompletionsCount] = useState(0);
  const [projects, setProjects] = useState([]);
  const [teamWorkload, setTeamWorkload] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [riskRes, tasksRes, projectsRes, workloadRes] = await Promise.all([
        api.get('/risk/summary'),
        api.get('/risk/tasks'),
        api.get('/projects'),
        api.get('/workload'),
      ]);

      if (riskRes.data.success) {
        const s = riskRes.data.summary;
        setSummary({
          totalActive: s.totalActive,
          completed: s.completedCount || 0,
          atRisk: (s.highCount || 0) + (s.criticalCount || 0),
          overdue: s.overdueCount || 0,
          blocked: s.blockedCount || 0,
        });
      }

      if (tasksRes.data.success) {
        setAtRiskTasks(tasksRes.data.tasks.slice(0, 5));
        const completions = tasksRes.data.tasks.filter((t) => t.completionRequested || t.status === 'IN_REVIEW');
        setPendingCompletionsCount(completions.length);
      }

      if (projectsRes.data.success) {
        setProjects(projectsRes.data.projects);
      }

      if (workloadRes.data.success) {
        setTeamWorkload(workloadRes.data.teamWorkload || []);
      }
    } catch (error) {
      console.error('Error loading manager dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="text-sm font-bold text-slate-700">Loading WorkRadar Command Center...</span>
      </div>
    );
  }

  const chartData = teamWorkload.map((w) => ({
    name: w.user.name.split(' ')[0],
    workload: w.workloadPercentage,
    status: w.status,
    hours: w.totalEstimatedHours,
  }));

  const overallTotal = summary.totalActive + summary.completed;
  const overallCompletionRate = overallTotal > 0 ? Math.round((summary.completed / overallTotal) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Delay Radar Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Executive Command Center
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Real-time workforce health monitoring, proactive delay risk alerts, and workload balancing.
          </p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
          <button
            onClick={() => navigate('/manager/projects')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs whitespace-nowrap shrink-0"
          >
            <FolderKanban className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Projects ({projects.length})</span>
          </button>

          <button
            onClick={() => navigate('/manager/tasks')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Pending Completion Approval Alert Banner (if any) */}
      {pendingCompletionsCount > 0 && (
        <div
          onClick={() => navigate('/manager/extensions')}
          className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl cursor-pointer hover:bg-indigo-100/70 transition flex items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950">
                {pendingCompletionsCount} Task Completion {pendingCompletionsCount === 1 ? 'Submission' : 'Submissions'} Awaiting Your Approval!
              </p>
              <p className="text-[11px] text-indigo-700 font-medium">
                Developers have submitted finished tasks for review. Click to inspect deliverables and approve.
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 shrink-0 whitespace-nowrap">
            <span>Review Submissions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div
          onClick={() => navigate('/manager/tasks')}
          className="bg-white border border-slate-200/90 hover:border-slate-300 p-4 sm:p-5 rounded-2xl cursor-pointer transition shadow-2xs space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Tasks</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">{summary.totalActive}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">In flight across all projects</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/manager/tasks')}
          className="bg-white border border-slate-200/90 hover:border-slate-300 p-4 sm:p-5 rounded-2xl cursor-pointer transition shadow-2xs space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">{summary.completed}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">{overallCompletionRate}% completion rate</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/manager/risk-center')}
          className="bg-white border border-slate-200/90 hover:border-rose-300 p-4 sm:p-5 rounded-2xl cursor-pointer transition shadow-2xs space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">High Risk Delays</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono">{summary.atRisk}</p>
            <p className="text-[11px] text-rose-700 mt-0.5 font-medium">Require manager attention</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/manager/extensions')}
          className="bg-white border border-slate-200/90 hover:border-amber-300 p-4 sm:p-5 rounded-2xl cursor-pointer transition shadow-2xs space-y-2 group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Approvals</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">{pendingCompletionsCount + summary.blocked}</p>
            <p className="text-[11px] text-amber-800 mt-0.5 font-medium">{pendingCompletionsCount} completions • {summary.blocked} blockers</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column (7 cols): Urgent Attention Center */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h2 className="text-base font-extrabold text-slate-900">Urgent Action Center</h2>
            </div>
            <button
              onClick={() => navigate('/manager/risk-center')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>View Risk Radar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
            {atRiskTasks.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {atRiskTasks.map((task) => {
                  const assignees = Array.isArray(task.assignedTo)
                    ? task.assignedTo
                    : [task.assignedTo].filter(Boolean);
                  return (
                    <div
                      key={task._id}
                      onClick={() => navigate(`/manager/tasks/${task._id}`)}
                      className="p-4 sm:p-5 hover:bg-slate-50/80 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition">
                            {task.title}
                          </span>
                          {task.isBlocked && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                              BLOCKED
                            </span>
                          )}
                          {task.completionRequested && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                              COMPLETION REQUESTED
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 flex items-center space-x-2 flex-wrap font-medium">
                          <span>Project: <strong className="text-slate-900">{task.projectId?.name || 'N/A'}</strong></span>
                          <span>•</span>
                          <span>Assignee(s): <strong className="text-slate-900 font-bold">
                            {assignees.map((u) => u.name).join(', ') || 'Unassigned'}
                          </strong></span>
                        </p>

                        {task.riskFactors && task.riskFactors.length > 0 && (
                          <p className="text-xs text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 w-fit font-mono font-medium">
                            ⚠️ {task.riskFactors[0]}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                        <RiskScoreBadge score={task.riskScore} level={task.riskLevel} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center text-xs text-slate-500 font-medium">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <span>Zero delay risks detected! All active tasks are on schedule.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Live Team Capacity Radar */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-slate-900" />
              <h2 className="text-base font-extrabold text-slate-900">Team Capacity Radar</h2>
            </div>
            <button
              onClick={() => navigate('/manager/workload')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>Detailed Workload</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            {/* Horizontal Mini Workload Bars */}
            <div className="space-y-3">
              {teamWorkload.slice(0, 4).map((w) => {
                const isOver = w.workloadPercentage > 100;
                return (
                  <div key={w.user._id} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-800">{w.user.name}</span>
                      <span className={`font-mono font-bold ${isOver ? 'text-rose-600' : 'text-slate-900'}`}>
                        {w.workloadPercentage}% ({w.totalEstimatedHours}h)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isOver ? 'bg-rose-600' : w.workloadPercentage > 75 ? 'bg-indigo-600' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, w.workloadPercentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Chart */}
            <div className="h-40 w-full pt-2 border-t border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashboardCapacityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={600} />
                  <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="workload"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#dashboardCapacityGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <button
              onClick={() => navigate('/manager/workload')}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              Rebalance Team Workload
            </button>
          </div>
        </div>
      </div>

      {/* Projects Portfolio Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderKanban className="w-4 h-4 text-slate-900" />
            <h2 className="text-base font-extrabold text-slate-900">Active Projects Portfolio</h2>
          </div>
          <button
            onClick={() => navigate('/manager/projects')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <span>All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate('/manager/projects')}
              className="bg-white border border-slate-200/90 hover:border-slate-300 p-5 rounded-2xl cursor-pointer transition shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{p.name}</h3>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                  {p.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{p.description || 'No description provided.'}</p>
              
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-slate-600 font-semibold">
                  <span>Progress</span>
                  <span className="font-mono text-slate-900 font-bold">{p.completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-slate-900 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${p.completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
