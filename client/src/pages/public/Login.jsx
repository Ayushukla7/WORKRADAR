import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Activity, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result?.success) {
      if (result.user.role === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } else {
      setError(result?.message || 'Login failed. Please check credentials.');
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError(null);

    const result = await login(demoEmail, demoPassword);
    setLoading(false);

    if (result?.success) {
      if (result.user.role === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } else {
      setError(result?.message || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center p-3 bg-slate-900 text-white rounded-xl shadow-xs mb-4 cursor-pointer"
        >
          <Activity className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Sign in to WorkRadar</h2>
        <p className="mt-1 text-xs text-slate-500">Predictive Task & Workforce Management</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 p-8 shadow-xl rounded-2xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@workradar.io"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center space-x-1 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>One-Click Seed Accounts</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleQuickLogin('manager@workradar.io', 'Password123!')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs transition flex justify-between items-center group"
              >
                <div>
                  <span className="font-bold text-slate-900">Sarah Connor</span>
                  <span className="text-[10px] text-slate-500 block font-mono">manager@workradar.io</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono">
                  MANAGER
                </span>
              </button>

              <button
                onClick={() => handleQuickLogin('ayush@workradar.io', 'Password123!')}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs transition flex justify-between items-center group"
              >
                <div>
                  <span className="font-bold text-slate-900">Ayush Sharma</span>
                  <span className="text-[10px] text-slate-500 block font-mono">ayush@workradar.io</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                  EMPLOYEE
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-slate-900 hover:underline font-bold">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
