import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, ShieldAlert, ArrowRight, BarChart3, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    const result = await login(demoEmail, demoPassword);
    if (result?.success) {
      if (result.user.role === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-2xs">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-2 bg-slate-900 text-white rounded-xl shadow-xs">
            <Radar className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">WorkRadar</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 px-4 py-2 rounded-xl transition"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition shadow-xs flex items-center space-x-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-center flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Predictive Task & Workforce Management</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
          Don't tell the manager a task is late.<br />
          <span className="text-slate-500">
            Tell them it is likely to become late.
          </span>
        </h1>

        <p className="text-slate-600 text-sm sm:text-base max-w-xl leading-relaxed font-semibold">
          WorkRadar evaluates schedule velocity, active blocker flags, prerequisite dependencies, and employee workload capacity to forecast task delay risks before deadlines expire.
        </p>

        {/* 1-Click Demo Login Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full max-w-md space-y-4">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>Instant Demo Login</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickLogin('manager@workradar.io', 'Password123!')}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition text-left flex flex-col justify-between space-y-1 shadow-xs"
            >
              <span className="text-[10px] text-slate-400 font-mono uppercase">Manager Portal</span>
              <span className="font-extrabold text-sm">Pooja Sharma</span>
            </button>

            <button
              onClick={() => handleQuickLogin('ayush@workradar.io', 'Password123!')}
              className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition text-left flex flex-col justify-between space-y-1"
            >
              <span className="text-[10px] text-slate-500 font-mono uppercase">Developer Portal</span>
              <span className="font-extrabold text-sm">Ayush</span>
            </button>
          </div>
        </div>

        {/* 3 Core Platform Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full pt-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl w-fit border border-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delay Risk Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Transparent 0-100 mathematical risk scoring measuring progress velocity, dependency status, and time urgency.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl w-fit border border-slate-200">
              <BarChart3 className="w-5 h-5 text-slate-900" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Workload Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Prevents developer burnout by detecting task overload percentages before assigning new tasks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl w-fit border border-amber-200">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Blockers & Extensions</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              One-click blocker logging and structured deadline extension request approvals for transparent team communication.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        WorkRadar Platform &copy; {new Date().getFullYear()} — Built with MERN Stack
      </footer>
    </div>
  );
};

export default LandingPage;
