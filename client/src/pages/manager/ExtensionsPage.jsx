import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Check, X, RefreshCw } from 'lucide-react';

const ExtensionsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [managerComment, setManagerComment] = useState({});

  const fetchExtensions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/extensions');
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Error fetching extension requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, []);

  const handleReview = async (requestId, status) => {
    try {
      const comment = managerComment[requestId] || '';
      await api.put(`/extensions/${requestId}/review`, { status, managerComment: comment });
      fetchExtensions();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to review request');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
        <span className="text-sm font-medium">Loading extension requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Deadline Extension Requests</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review employee extension requests, evaluate impact, and approve or decline.
        </p>
      </div>

      {/* Extension Requests Grid */}
      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Task: {req.taskId?.title || 'N/A'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Requested by: <strong className="text-slate-900">{req.requestedBy?.name}</strong> (
                    {req.requestedBy?.designation})
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                    req.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : req.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
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
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <input
                    type="text"
                    placeholder="Optional manager review comment..."
                    value={managerComment[req._id] || ''}
                    onChange={(e) =>
                      setManagerComment({ ...managerComment, [req._id]: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
                  />

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => handleReview(req._id, 'REJECTED')}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Decline Request</span>
                    </button>

                    <button
                      onClick={() => handleReview(req._id, 'APPROVED')}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5"
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
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            No extension requests logged.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtensionsPage;
