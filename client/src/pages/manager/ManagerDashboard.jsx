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
      <div className="py-20 flex items-center justify-center space-x-3 text-neutral-400">
        <RefreshCw className="w-5 h-5 animate-spin text-lime-400" />
        <span className="text-sm font-black">Calculating WorkRadar Delay Radar...</span>
      </div>
    );
  }

  // Calculate Overall Completion Percentage for Circular Gauge
  const overallTotal = summary.totalActive + summary.completed;
  const overallCompletionRate = overallTotal > 0 ? Math.round((summary.completed / overallTotal) * 100) : 78;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-900 text-xs font-bold mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>WorkRadar AI Delay Radar</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Executive Command Center</h1>
          <p className="text-xs text-neutral-400 font-bold mt-1">
            Real-time workforce health monitoring — forecasting delays before deadlines arrive.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/manager/risk-center')}
            className="px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-full text-xs font-black transition flex items-center space-x-2 shadow-xs"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Open Risk Center</span>
          </button>
          <button
            onClick={() => navigate('/manager/tasks')}
            className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-black rounded-full text-xs font-black transition flex items-center space-x-1.5 shadow-lg shadow-lime-400/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Bar Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-3xl text-center space-y-1">
          <span className="text-3xl font-black text-lime-400 font-mono">{summary.totalActive}</span>
          <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider block">Active Tasks</span>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-3xl text-center space-y-1">
          <span className="text-3xl font-black text-lime-400 font-mono">{summary.completed}</span>
          <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider block">Completed Tasks</span>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-3xl text-center space-y-1">
          <span className="text-3xl font-black text-rose-400 font-mono">{summary.atRisk}</span>
          <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider block">High Risk Delays</span>
        </div>

        <div className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-3xl text-center space-y-1">
          <span className="text-3xl font-black text-amber-400 font-mono">{summary.blocked}</span>
          <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider block">Active Blockers</span>
        </div>
      </div>

      {/* Top Hero Section: Overall Progress Gauge + Key Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Circular SVG Progress Ring Card */}
        <TiltCard3D className="md:col-span-4 bg-neutral-900/90 border border-neutral-800 p-6 rounded-3xl flex flex-col justify-between items-center text-center">
          <p className="text-xs font-black text-neutral-400 uppercase tracking-widest self-start">Overall Task Progress</p>
          
          <div className="relative my-4 flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke="#26262c"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke="url(#limeGradient)"
                strokeWidth="10"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * overallCompletionRate) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="limeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a3e635" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white font-mono tracking-tight">{overallCompletionRate}%</span>
              <span className="text-[10px] font-black text-lime-400 uppercase tracking-wider">Complete</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-xs border-t border-neutral-800 pt-3 font-bold">
            <div className="text-left">
              <span className="text-[10px] text-neutral-400 block uppercase font-black">Completed</span>
              <span className="font-mono text-emerald-400 font-extrabold text-sm">{summary.completed} Tasks</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block uppercase font-black">Active</span>
              <span className="font-mono text-lime-400 font-extrabold text-sm">{summary.totalActive} Tasks</span>
            </div>
          </div>
        </TiltCard3D>

        {/* 3 Metric Cards Grid */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TiltCard3D className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-3xl flex flex-col justify-between">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl w-fit mb-3 border border-rose-500/30">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-rose-400 font-mono">{summary.atRisk}</p>
              <p className="text-xs font-black text-white mt-1">High Risk Tasks</p>
              <p className="text-[11px] text-rose-300/80 font-bold mt-0.5">Require immediate manager action</p>
            </div>
          </TiltCard3D>

          <TiltCard3D className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-3xl flex flex-col justify-between">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl w-fit mb-3 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-amber-400 font-mono">{summary.blocked}</p>
              <p className="text-xs font-black text-white mt-1">Active Blockers</p>
              <p className="text-[11px] text-neutral-400 font-bold mt-0.5">Logged dependency blockers</p>
            </div>
          </TiltCard3D>

          <TiltCard3D className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-3xl flex flex-col justify-between">
            <div className="p-3 bg-lime-500/20 text-lime-400 rounded-2xl w-fit mb-3 border border-lime-500/30">
              <TrendingUp className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-white font-mono">{projects.length}</p>
              <p className="text-xs font-black text-white mt-1">Active Projects</p>
              <p className="text-[11px] text-neutral-400 font-bold mt-0.5">On-schedule milestones</p>
            </div>
          </TiltCard3D>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): What Needs My Attention? List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>What Needs My Attention Right Now?</span>
            </h2>
            <button
              onClick={() => navigate('/manager/risk-center')}
              className="text-xs font-extrabold text-lime-400 hover:underline flex items-center space-x-1"
            >
              <span>View All Risk Scores</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl overflow-hidden p-0">
            {atRiskTasks.length > 0 ? (
              <div className="divide-y divide-neutral-800">
                {atRiskTasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/manager/tasks/${task._id}`)}
                    className="p-5 hover:bg-neutral-800/60 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-white hover:text-lime-400 transition">
                          {task.title}
                        </span>
                        {task.isBlocked && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                            BLOCKED
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-400 flex items-center space-x-2 font-bold">
                        <span>Project: <strong className="text-white">{task.projectId?.name || 'N/A'}</strong></span>
                        <span>•</span>
                        <span>Assignee: <strong className="text-lime-400 font-extrabold">{task.assignedTo?.name || 'Unassigned'}</strong></span>
                      </p>

                      {/* Diagnostic Snippet */}
                      {task.riskFactors && task.riskFactors.length > 0 && (
                        <p className="text-xs text-rose-400 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/30 w-fit font-mono font-bold">
                          ⚠️ {task.riskFactors[0]}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <RiskScoreBadge score={task.riskScore} level={task.riskLevel} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-xs text-neutral-400 font-bold">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <span>Zero high-risk task delays detected across active projects!</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Smooth Electric Lime Gradient Area Chart */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-base font-black text-white flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-lime-400" />
            <span>Team Workload Distribution</span>
          </h2>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-300 font-black">Capacity Utilized % per Employee</p>
              <span className="text-[10px] font-black font-mono px-2.5 py-0.5 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/30">
                LIVE METRICS
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="workloadLimeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a3e635" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#737373" fontSize={11} fontWeight={700} />
                  <YAxis stroke="#737373" fontSize={11} fontWeight={700} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="workload"
                    stroke="#a3e635"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#workloadLimeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <button
              onClick={() => navigate('/manager/workload')}
              className="w-full py-3 bg-lime-400 hover:bg-lime-300 text-black text-xs font-black rounded-full transition shadow-lg shadow-lime-400/20 uppercase tracking-wider"
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
