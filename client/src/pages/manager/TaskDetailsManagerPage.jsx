import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import RiskBreakdownCard from '../../components/risk/RiskBreakdownCard';
import { ArrowLeft, RefreshCw, Send, MessageSquare } from 'lucide-react';

const TaskDetailsManagerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const [taskRes, commentRes, userRes] = await Promise.all([
        api.get(`/tasks/${id}`),
        api.get(`/tasks/${id}/comments`),
        api.get('/auth/users'),
      ]);

      if (taskRes.data.success) setTask(taskRes.data.task);
      if (commentRes.data.success) setComments(commentRes.data.comments);
      if (userRes.data.success) setTeamUsers(userRes.data.users);
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const handleReassign = async (newAssigneeId) => {
    try {
      await api.put(`/tasks/${id}`, { assignedTo: newAssigneeId });
      fetchTaskDetails();
    } catch (error) {
      alert('Failed to reassign task');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const response = await api.post(`/tasks/${id}/comments`, { text: newComment });
      if (response.data.success) {
        setNewComment('');
        fetchTaskDetails();
      }
    } catch (error) {
      alert('Failed to post comment');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
        <span className="text-sm font-medium">Loading task details...</span>
      </div>
    );
  }

  if (!task) return <div>Task not found</div>;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/manager/tasks')}
        className="flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Tasks</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Risk Diagnostic & Controls */}
        <div className="lg:col-span-7 space-y-6">
          <RiskBreakdownCard task={task} />

          {/* Quick Management Action Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Manager Quick Controls</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reassign Employee</label>
                <select
                  value={task.assignedTo?._id || ''}
                  onChange={(e) => handleReassign(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  {teamUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.designation || u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Task Status Override</label>
                <select
                  value={task.status}
                  onChange={async (e) => {
                    await api.put(`/tasks/${id}`, { status: e.target.value });
                    fetchTaskDetails();
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Comment Discussion Thread */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-slate-700" />
            <span>Task Discussion Thread ({comments.length})</span>
          </h3>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between min-h-[400px]">
            {/* Comment List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center text-slate-500 text-[10px]">
                      <span className="font-bold text-slate-900">{comment.authorId?.name}</span>
                      <span className="font-mono">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{comment.text}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">No comments yet. Start the conversation below.</div>
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handlePostComment} className="flex items-center space-x-2 pt-3 border-t border-slate-200">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a message to assignee..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900"
              />
              <button
                type="submit"
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition shadow-2xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsManagerPage;
