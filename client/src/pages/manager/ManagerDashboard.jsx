import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RiskScoreBadge from '../../components/risk/RiskScoreBadge';
import TiltCard3D from '../../components/common/TiltCard3D';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Plus,
  Activity
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
  const [projects, setProjects] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);

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
      }

      if (projectsRes.data.success) {
        setProjects(projectsRes.data.projects);
      }

      if (workloadRes.data.success) {
        const chartData = workloadRes.data.teamWorkload.map((w) => ({
          name: w.user.name.split(' ')[0],
          workload: w.workloadPercentage,
          status: w.status,
          hours: w.totalEstimatedHours,
        }));
        setWorkloadData(chartData);
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
      <div className="py-20 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
        <span className="text-sm font-bold">Calculating WorkRadar Delay Radar...</span>
      </div>
    );
  }

  // Calculate Overall Completion Percentage for Circular Gauge
  const overallTotal = summary.totalActive + summary.completed;
  const overallCompletionRate = overallTotal > 0 ? Math.round((summary.completed / overallTotal) * 100) : 78;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-900 text-xs font-bold mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>WorkRadar AI Delay Radar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Executive Command Center</h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Real-time workforce health monitoring — forecasting delays before deadlines arrive.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 sm:space-x-3 flex-wrap">
          <button
            onClick={() => navigate('/manager/risk-center')}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 shadow-2xs"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Open Risk Center</span>
          </button>
          <button
            onClick={() => navigate('/manager/tasks')}
            className="px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Bar Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl text-center space-y-1 shadow-2xs">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{summary.totalActive}</span>
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Active Tasks</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl text-center space-y-1 shadow-2xs">
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{summary.completed}</span>
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Completed Tasks</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl text-center space-y-1 shadow-2xs">
          <span className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">{summary.atRisk}</span>
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">High Risk Delays</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl text-center space-y-1 shadow-2xs">
          <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">{summary.blocked}</span>
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Active Blockers</span>
        </div>
      </div>

      {/* Top Section: Progress Ring Gauge + Key Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Circular SVG Progress Ring Card */}
        <TiltCard3D className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between items-center text-center shadow-xs">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest self-start">Overall Task Progress</p>
          
          <div className="relative my-4 flex items-center justify-center">
            <svg className="w-32 h-32 sm:w-36 sm:h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="56"
                stroke="#e2e8f0"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="56"
                stroke="url(#slateGradient)"
                strokeWidth="10"
                strokeDasharray="352"
                strokeDashoffset={352 - (352 * overallCompletionRate) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="slateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">{overallCompletionRate}%</span>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Complete</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3 font-bold">
            <div className="text-left">
              <span className="text-[10px] text-slate-500 block uppercase font-black">Completed</span>
              <span className="font-mono text-emerald-600 font-extrabold text-sm">{summary.completed} Tasks</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-black">Active</span>
              <span className="font-mono text-slate-900 font-extrabold text-sm">{summary.totalActive} Tasks</span>
            </div>
          </div>
        </TiltCard3D>

        {/* 3 Metric Cards Grid */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TiltCard3D className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-2xs">
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl w-fit mb-3 border border-rose-200">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-3xl font-black text-rose-600 font-mono">{summary.atRisk}</p>
              <p className="text-xs font-black text-slate-900 mt-1">High Risk Tasks</p>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">Require immediate manager action</p>
            </div>
          </TiltCard3D>

          <TiltCard3D className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-2xs">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl w-fit mb-3 border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-black text-amber-600 font-mono">{summary.blocked}</p>
              <p className="text-xs font-black text-slate-900 mt-1">Active Blockers</p>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">Logged dependency blockers</p>
            </div>
          </TiltCard3D>

          <TiltCard3D className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-2xs">
            <div className="p-3 bg-slate-100 text-slate-900 rounded-xl w-fit mb-3 border border-slate-200">
              <TrendingUp className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 font-mono">{projects.length}</p>
              <p className="text-xs font-black text-slate-900 mt-1">Active Projects</p>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">On-schedule milestones</p>
            </div>
          </TiltCard3D>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column (7 cols): What Needs My Attention? List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>What Needs My Attention Right Now?</span>
            </h2>
            <button
              onClick={() => navigate('/manager/risk-center')}
              className="text-xs font-extrabold text-slate-900 hover:underline flex items-center space-x-1"
            >
              <span>View All Risk Scores</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            {atRiskTasks.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {atRiskTasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/manager/tasks/${task._id}`)}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-sm font-black text-slate-900 hover:text-slate-700 transition">
                          {task.title}
                        </span>
                        {task.isBlocked && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                            BLOCKED
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 flex items-center space-x-2 font-semibold flex-wrap">
                        <span>Project: <strong className="text-slate-900">{task.projectId?.name || 'N/A'}</strong></span>
                        <span>•</span>
                        <span>Assignee: <strong className="text-slate-900 font-bold">{task.assignedTo?.name || 'Unassigned'}</strong></span>
                      </p>

                      {/* Diagnostic Snippet */}
                      {task.riskFactors && task.riskFactors.length > 0 && (
                        <p className="text-xs text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200 w-fit font-mono font-semibold">
                          ⚠️ {task.riskFactors[0]}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                      <RiskScoreBadge score={task.riskScore} level={task.riskLevel} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 sm:p-10 text-center text-xs text-slate-500 font-semibold">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <span>Zero high-risk task delays detected across active projects!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Smooth Slate Gradient Area Chart */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-slate-900" />
            <span>Team Workload Distribution</span>
          </h2>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-700 font-bold">Capacity Utilized % per Employee</p>
              <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                LIVE METRICS
              </span>
            </div>

            <div className="h-52 sm:h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="workloadSlateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight={700} />
                  <YAxis stroke="#64748b" fontSize={11} fontWeight={700} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="workload"
                    stroke="#0f172a"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#workloadSlateGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <button
              onClick={() => navigate('/manager/workload')}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs uppercase tracking-wider"
            >
              Analyze Full Team Workload Capacity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
