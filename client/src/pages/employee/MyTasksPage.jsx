import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RiskScoreBadge from '../../components/risk/RiskScoreBadge';
import { AlertTriangle, Clock, RefreshCw, X, CheckCircle2, MessageSquare, Send } from 'lucide-react';

const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTaskForModal, setActiveTaskForModal] = useState(null);
  const [modalType, setModalType] = useState(null); // 'BLOCKER', 'EXTENSION', or 'COMPLETION'

  // Blocker Form State
  const [blockerReason, setBlockerReason] = useState('');
  const [blockerCategory, setBlockerCategory] = useState('TECHNICAL');

  // Extension Form State
  const [requestedDeadline, setRequestedDeadline] = useState('');
  const [extensionReason, setExtensionReason] = useState('');

  // Completion Form State
  const [completionNote, setCompletionNote] = useState('');

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

  const handleRequestCompletion = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/tasks/${activeTaskForModal._id}/request-completion`, {
        completionNote,
      });
      alert('Task completion request submitted to your manager for review!');
      setModalType(null);
      setCompletionNote('');
      fetchMyTasks();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit completion request');
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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Assigned Tasks</h1>
        <p className="text-xs text-slate-500 mt-1">
          Update progress velocity, submit work for completion approval, log blockers, or request deadline extensions.
        </p>
      </div>

      {/* Task List Cards */}
      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo].filter(Boolean);
            const isCompleted = task.status === 'COMPLETED';
            const isUnderReview = task.status === 'IN_REVIEW' || task.completionRequested;

            return (
              <div
                key={task._id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs space-y-4 ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{task.title}</h3>
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                          COMPLETED
                        </span>
                      )}
                      {isUnderReview && !isCompleted && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px] border border-indigo-200">
                          AWAITING MANAGER APPROVAL
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-1.5">
                      <span>Project: <strong className="text-slate-900">{task.projectId?.name || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Priority: <strong className="text-slate-900">{task.priority}</strong></span>
                      {assignees.length > 1 && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 text-[10px]">
                          Co-assigned ({assignees.map((u) => u.name).join(', ')}) • Split: {Math.round((task.estimatedHours / assignees.length) * 10) / 10}h
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <RiskScoreBadge score={task.riskScore} level={task.riskLevel} />
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {task.description}
                  </p>
                )}

                {/* Completion Request Pending Banner */}
                {isUnderReview && !isCompleted && (
                  <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-xs text-indigo-900 flex items-start space-x-2.5">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Completion Approval Requested:</span>
                      <p className="text-indigo-800 mt-0.5 font-medium">
                        "{task.completionNote || 'Work submitted for review.'}" — Awaiting manager confirmation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Manager Feedback Banner (if rejected or commented) */}
                {task.completionFeedback && (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-700 flex items-start space-x-2">
                    <MessageSquare className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Latest Manager Review Feedback:</span>
                      <p className="text-slate-700 mt-0.5">{task.completionFeedback}</p>
                    </div>
                  </div>
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

                {/* Progress Slider (disabled if completed) */}
                {!isCompleted && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 font-semibold">Progress Velocity Percentage</span>
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
                )}

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</span>
                  </div>

                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    {/* Completion Request Button */}
                    {!isCompleted && !isUnderReview && (
                      <button
                        onClick={() => {
                          setActiveTaskForModal(task);
                          setModalType('COMPLETION');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-xs whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Submit for Completion Approval</span>
                      </button>
                    )}

                    {!task.isBlocked && !isCompleted && (
                      <button
                        onClick={() => {
                          setActiveTaskForModal(task);
                          setModalType('BLOCKER');
                        }}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition flex items-center space-x-1 whitespace-nowrap"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Report Blocker</span>
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        onClick={() => {
                          setActiveTaskForModal(task);
                          setModalType('EXTENSION');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center space-x-1 whitespace-nowrap"
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Request Extension</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 font-medium">
            No assigned tasks found.
          </div>
        )}
      </div>

      {/* Completion Request Modal */}
      {modalType === 'COMPLETION' && activeTaskForModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Request Task Completion Approval</span>
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-900 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900">{activeTaskForModal.title}</span>
              <p className="text-slate-500">
                Project: {activeTaskForModal.projectId?.name || 'N/A'} • Effort: {activeTaskForModal.estimatedHours} hrs
              </p>
            </div>

            <form onSubmit={handleRequestCompletion} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Completion Statement / Deliverables Note
                </label>
                <textarea
                  rows={3}
                  required
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="e.g. Maine yeh task pura complete aur test kar diya hai, please approve kar dijiye..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request to Manager</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blocker Modal */}
      {modalType === 'BLOCKER' && activeTaskForModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Log Active Blocker</span>
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-900 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogBlocker} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blocker Category</label>
                <select
                  value={blockerCategory}
                  onChange={(e) => setBlockerCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value="TECHNICAL">Technical Bug / Infrastructure Failure</option>
                  <option value="DEPENDENCY">Waiting on Dependent Task Completion</option>
                  <option value="MANAGER_APPROVAL">Waiting on Manager Decision / Approval</option>
                  <option value="SPECIFICATION">Unclear Task Requirements / Scope Ambiguity</option>
                  <option value="EXTERNAL">External Client API / 3rd-Party Vendor Issue</option>
                  <option value="OTHER">Other Unforeseen Blocker</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Reason</label>
                <textarea
                  rows={3}
                  required
                  value={blockerReason}
                  onChange={(e) => setBlockerReason(e.target.value)}
                  placeholder="Explain why you cannot make progress right now..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition font-bold shadow-xs"
                >
                  Flag as Blocked
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deadline Extension Modal */}
      {modalType === 'EXTENSION' && activeTaskForModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-slate-900" />
                <span>Request Deadline Extension</span>
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-900 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestExtension} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Requested Deadline</label>
                <input
                  type="date"
                  required
                  value={requestedDeadline}
                  onChange={(e) => setRequestedDeadline(e.target.value)}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justification Reason</label>
                <textarea
                  rows={3}
                  required
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Explain why extra calendar days are needed..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-bold shadow-xs"
                >
                  Send Request
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
