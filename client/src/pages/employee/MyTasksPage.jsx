import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RiskScoreBadge from '../../components/risk/RiskScoreBadge';
import { AlertTriangle, Clock, RefreshCw, X } from 'lucide-react';

const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTaskForModal, setActiveTaskForModal] = useState(null);
  const [modalType, setModalType] = useState(null); // 'BLOCKER' or 'EXTENSION'

  // Blocker Form State
  const [blockerReason, setBlockerReason] = useState('');
  const [blockerCategory, setBlockerCategory] = useState('TECHNICAL');

  // Extension Form State
  const [requestedDeadline, setRequestedDeadline] = useState('');
  const [extensionReason, setExtensionReason] = useState('');

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks');
      if (response.data.success) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Error loading my tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const handleUpdateProgress = async (taskId, newProgress) => {
    try {
      await api.put(`/tasks/${taskId}`, { progressPercentage: newProgress });
      fetchMyTasks();
    } catch (error) {
      alert('Failed to update progress');
    }
  };

  const handleLogBlocker = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/tasks/${activeTaskForModal._id}`, {
        isBlocked: true,
        status: 'BLOCKED',
        blockerReason,
        blockerCategory,
      });
      setModalType(null);
      setBlockerReason('');
      fetchMyTasks();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to log blocker');
    }
  };

  const handleUnblock = async (taskId) => {
    try {
      await api.put(`/tasks/${taskId}`, {
        isBlocked: false,
        status: 'IN_PROGRESS',
        blockerReason: '',
        blockerCategory: 'NONE',
      });
      fetchMyTasks();
    } catch (error) {
      alert('Failed to unblock task');
    }
  };

  const handleRequestExtension = async (e) => {
    e.preventDefault();
    try {
      await api.post('/extensions', {
        taskId: activeTaskForModal._id,
        requestedDeadline,
        reason: extensionReason,
      });
      alert('Deadline extension request sent to your manager!');
      setModalType(null);
      setRequestedDeadline('');
      setExtensionReason('');
      fetchMyTasks();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit extension request');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
        <span className="text-sm font-medium">Loading your assigned tasks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Assigned Tasks</h1>
        <p className="text-xs text-slate-500 mt-1">
          Update progress, log active blockers, or request deadline extensions.
        </p>
      </div>

      {/* Task List Cards */}
      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">{task.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Project: <strong className="text-slate-900">{task.projectId?.name || 'N/A'}</strong> • Priority:{' '}
                    <strong className="text-slate-900">{task.priority}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <RiskScoreBadge score={task.riskScore} level={task.riskLevel} />
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {task.description}
                </p>
              )}

              {/* Active Blocker Box */}
              {task.isBlocked && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Task is Currently Blocked:</span>
                      <p className="text-slate-700 mt-0.5">{task.blockerReason || 'Reason unspecified'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnblock(task._id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition shrink-0"
                  >
                    Unblock Task
                  </button>
                </div>
              )}

              {/* Progress Slider */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Progress Velocity Percentage</span>
                  <span className="font-mono text-slate-900 font-bold">{task.progressPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={task.progressPercentage}
                  onChange={(e) => handleUpdateProgress(task._id, Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {!task.isBlocked && (
                    <button
                      onClick={() => {
                        setActiveTaskForModal(task);
                        setModalType('BLOCKER');
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Report Blocker</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveTaskForModal(task);
                      setModalType('EXTENSION');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Request Deadline Extension</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            No assigned tasks found.
          </div>
        )}
      </div>

      {/* Blocker Modal */}
      {modalType === 'BLOCKER' && activeTaskForModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Log Active Task Blocker</span>
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogBlocker} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blocker Category</label>
                <select
                  value={blockerCategory}
                  onChange={(e) => setBlockerCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value="DEPENDENCY">Waiting for prerequisite dependency task</option>
                  <option value="TECHNICAL">Technical roadblock / Architecture issue</option>
                  <option value="MANAGER_APPROVAL">Waiting for manager approval / feedback</option>
                  <option value="EXTERNAL">External API or client dependency</option>
                  <option value="SPECIFICATION">Requirement unclear / Specification needed</option>
                  <option value="OTHER">Other blocker reason</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Blocker Explanation</label>
                <textarea
                  rows={3}
                  required
                  value={blockerReason}
                  onChange={(e) => setBlockerReason(e.target.value)}
                  placeholder="Explain why this task cannot proceed..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold shadow-xs"
                >
                  Log Blocker & Recalculate Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extension Modal */}
      {modalType === 'EXTENSION' && activeTaskForModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-900" />
                <span>Request Deadline Extension</span>
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestExtension} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Deadline</label>
                <input
                  type="text"
                  disabled
                  value={
                    activeTaskForModal.deadline
                      ? new Date(activeTaskForModal.deadline).toLocaleDateString()
                      : ''
                  }
                  className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requested New Deadline</label>
                <input
                  type="date"
                  required
                  value={requestedDeadline}
                  onChange={(e) => setRequestedDeadline(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Extension Request</label>
                <textarea
                  rows={3}
                  required
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Explain why additional time is necessary..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-xs"
                >
                  Send Request to Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasksPage;
