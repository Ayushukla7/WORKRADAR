import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Check, X, RefreshCw, CheckCircle2, Clock, MessageSquare, AlertCircle } from 'lucide-react';

const ExtensionsPage = () => {
  const [activeTab, setActiveTab] = useState('COMPLETIONS'); // 'COMPLETIONS' or 'EXTENSIONS'
  const [completionTasks, setCompletionTasks] = useState([]);
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Feedback Inputs
  const [reviewFeedback, setReviewFeedback] = useState({});
  const [managerExtensionComment, setManagerExtensionComment] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, extensionsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/extensions'),
      ]);

      if (tasksRes.data.success) {
        // Filter tasks that have completionRequested or status === 'IN_REVIEW'
        const pendingCompletions = tasksRes.data.tasks.filter(
          (t) => t.completionRequested || t.status === 'IN_REVIEW'
        );
        setCompletionTasks(pendingCompletions);
      }

      if (extensionsRes.data.success) {
        setExtensionRequests(extensionsRes.data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReviewCompletion = async (taskId, approved) => {
    const feedback = reviewFeedback[taskId] || (approved ? 'Approved by manager.' : 'Please update deliverables.');
    try {
      const response = await api.put(`/tasks/${taskId}/review-completion`, {
        approved,
        feedback,
      });
      if (response.data.success) {
        alert(approved ? 'Task marked COMPLETED!' : 'Task returned to in-progress with feedback.');
        fetchData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to review completion');
    }
  };

  const handleReviewExtension = async (requestId, status) => {
    try {
      const comment = managerExtensionComment[requestId] || '';
      await api.put(`/extensions/${requestId}/review`, { status, managerComment: comment });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to review request');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
        <span className="text-sm font-medium">Loading approval requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Approvals & Requests Center</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review employee task completion submissions, approve finished deliverables, and manage deadline extensions.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('COMPLETIONS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'COMPLETIONS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Task Completion Approvals ({completionTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('EXTENSIONS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'EXTENSIONS'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Deadline Extensions ({extensionRequests.filter((r) => r.status === 'PENDING').length} Pending)</span>
        </button>
      </div>

      {/* Tab 1: Task Completion Approvals */}
      {activeTab === 'COMPLETIONS' && (
        <div className="space-y-4">
          {completionTasks.length > 0 ? (
            completionTasks.map((task) => {
              const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo].filter(Boolean);
              return (
                <div
                  key={task._id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 leading-tight">{task.title}</h3>
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                          PENDING APPROVAL
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Project: <strong className="text-slate-900">{task.projectId?.name || 'N/A'}</strong> • Assignee(s):{' '}
                        <strong className="text-slate-900">{assignees.map((u) => u.name).join(', ') || 'N/A'}</strong>
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-500 font-mono">
                      <span>Submitted: {task.completionRequestedAt ? new Date(task.completionRequestedAt).toLocaleDateString() : 'Recent'}</span>
                    </div>
                  </div>

                  {/* Developer Statement Note */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Developer Completion Statement:</span>
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      "{task.completionNote || 'Task finished and ready for manager verification.'}"
                    </p>
                  </div>

                  {/* Manager Feedback & Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <input
                      type="text"
                      placeholder="Feedback notes (e.g. Approved, great work! OR Please fix checkout validation bug)..."
                      value={reviewFeedback[task._id] || ''}
                      onChange={(e) =>
                        setReviewFeedback({ ...reviewFeedback, [task._id]: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                    />

                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => handleReviewCompletion(task._id, false)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>Request Changes</span>
                      </button>

                      <button
                        onClick={() => handleReviewCompletion(task._id, true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-xs flex items-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Mark Completed</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 font-medium">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <span>No pending completion requests. All submitted work has been reviewed!</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Deadline Extension Requests */}
      {activeTab === 'EXTENSIONS' && (
        <div className="space-y-4">
          {extensionRequests.length > 0 ? (
            extensionRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      Task: {req.taskId?.title || 'N/A'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Requested by: <strong className="text-slate-900">{req.requestedBy?.name}</strong> (
                      {req.requestedBy?.designation || 'Developer'})
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-md text-xs font-bold font-mono border ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : req.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {/* Deadline Comparison */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Current Deadline</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {new Date(req.currentDeadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Requested Deadline</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {new Date(req.requestedDeadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Employee Reason */}
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Reason Statement</span>
                  <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                    "{req.reason}"
                  </p>
                </div>

                {/* Manager Actions if PENDING */}
                {req.status === 'PENDING' && (
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <input
                      type="text"
                      placeholder="Optional manager review comment..."
                      value={managerExtensionComment[req._id] || ''}
                      onChange={(e) =>
                        setManagerExtensionComment({ ...managerExtensionComment, [req._id]: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                    />

                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => handleReviewExtension(req._id, 'REJECTED')}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline Extension</span>
                      </button>

                      <button
                        onClick={() => handleReviewExtension(req._id, 'APPROVED')}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-xs flex items-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Extension</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 font-medium">
              No extension requests logged.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExtensionsPage;
