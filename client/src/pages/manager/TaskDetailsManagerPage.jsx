import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import RiskBreakdownCard from '../../components/risk/RiskBreakdownCard';
import { ArrowLeft, RefreshCw, Send, MessageSquare, Users, CheckCircle2 } from 'lucide-react';

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

  const getAssigneeIds = () => {
    if (!task || !task.assignedTo) return [];
    if (Array.isArray(task.assignedTo)) {
      return task.assignedTo.map((u) => u._id || u);
    }
    return [task.assignedTo._id || task.assignedTo];
  };

  const handleToggleAssignee = async (userId) => {
    const currentIds = getAssigneeIds();
    let updatedIds;
    if (currentIds.includes(userId)) {
      if (currentIds.length === 1) {
        alert('A task must have at least one assigned team member.');
        return;
      }
      updatedIds = currentIds.filter((uid) => uid !== userId);
    } else {
      updatedIds = [...currentIds, userId];
    }

    try {
      await api.put(`/tasks/${id}`, { assignedTo: updatedIds });
      fetchTaskDetails();
    } catch (error) {
      alert('Failed to update task assignees');
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

  const currentAssigneeIds = getAssigneeIds();
  const assigneeCount = currentAssigneeIds.length || 1;
  const splitEffort = Math.round((task.estimatedHours / assigneeCount) * 10) / 10;

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
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Manager Quick Controls</h4>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                Effort Split: {splitEffort} hrs / person
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Assigned Team Members ({currentAssigneeIds.length})</span>
                  <span className="text-[10px] text-slate-500">Click to add/remove co-assignees</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {teamUsers.map((u) => {
                    const isSelected = currentAssigneeIds.includes(u._id);
                    return (
                      <div
                        key={u._id}
                        onClick={() => handleToggleAssignee(u._id)}
                        className={`p-2 rounded-lg cursor-pointer border transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-semibold text-xs truncate block">{u.name}</span>
                          <span className={`text-[10px] block truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            {u.designation || u.role}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-1" />}
                      </div>
                    );
                  })}
                </div>
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
                  <div key={comment._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{comment.authorId?.name || 'User'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{comment.text}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No comments posted on this task yet. Start the conversation below.
                </div>
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handlePostComment} className="pt-3 border-t border-slate-200 flex items-center space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a message or status note..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
              <button
                type="submit"
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition shadow-xs"
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
