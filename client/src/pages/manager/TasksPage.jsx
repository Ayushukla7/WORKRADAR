import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RiskScoreBadge from '../../components/risk/RiskScoreBadge';
import { CheckSquare, Plus, RefreshCw, AlertTriangle, Search, X, Users, CheckCircle2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TasksPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: [],
    priority: 'MEDIUM',
    estimatedHours: 8,
    deadline: '',
    dependencies: [],
  });

  const fetchTasksData = async () => {
    setLoading(true);
    try {
      const [taskRes, projRes, userRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/auth/users'),
      ]);

      if (taskRes.data.success) setTasks(taskRes.data.tasks);
      if (projRes.data.success) setProjects(projRes.data.projects);
      if (userRes.data.success) setTeamUsers(userRes.data.users);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  const toggleAssignee = (userId) => {
    setFormData((prev) => {
      const exists = prev.assignedTo.includes(userId);
      return {
        ...prev,
        assignedTo: exists
          ? prev.assignedTo.filter((id) => id !== userId)
          : [...prev.assignedTo, userId],
      };
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (formData.assignedTo.length === 0) {
      alert('Please assign at least one employee to this task.');
      return;
    }
    try {
      const response = await api.post('/tasks', formData);
      if (response.data.success) {
        setShowCreateModal(false);
        setFormData({
          title: '',
          description: '',
          projectId: '',
          assignedTo: [],
          priority: 'MEDIUM',
          estimatedHours: 8,
          deadline: '',
          dependencies: [],
        });
        fetchTasksData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getAssigneesArray = (assignedTo) => {
    if (Array.isArray(assignedTo)) return assignedTo;
    if (assignedTo) return [assignedTo];
    return [];
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
        <span className="text-sm font-medium">Loading task schedule...</span>
      </div>
    );
  }

  const assigneeCount = formData.assignedTo.length || 1;
  const splitHours = Math.round((formData.estimatedHours / assigneeCount) * 10) / 10;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Task Operations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Create tasks, co-assign multiple employees to split workload, and track delay risks.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-xs w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Task</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter tasks by name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Task Name</th>
                <th className="p-4">Project</th>
                <th className="p-4">Assignee(s)</th>
                <th className="p-4">Progress</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Delay Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const assignees = getAssigneesArray(task.assignedTo);
                  return (
                    <tr
                      key={task._id}
                      onClick={() => navigate(`/manager/tasks/${task._id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition"
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm hover:text-slate-700 transition">
                          {task.title}
                        </div>
                        {task.isBlocked && (
                          <div className="text-[10px] text-amber-800 font-semibold flex items-center space-x-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>BLOCKED: {task.blockerReason || 'Unspecified'}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-4 font-medium text-slate-700">
                        {task.projectId?.name || 'N/A'}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          {assignees.length > 0 ? (
                            assignees.map((assignee, idx) => (
                              <div
                                key={assignee._id || idx}
                                className="inline-flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200"
                              >
                                <div className="w-4 h-4 rounded-full bg-slate-900 text-white font-bold text-[9px] flex items-center justify-center">
                                  {assignee.name ? assignee.name.charAt(0) : 'U'}
                                </div>
                                <span className="font-semibold text-slate-900 text-[11px]">{assignee.name}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-400 font-medium">Unassigned</span>
                          )}
                          {assignees.length > 1 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Split ({Math.round((task.estimatedHours / assignees.length) * 10) / 10}h each)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-slate-900">
                        {task.progressPercentage}%
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-700">
                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="p-4">
                        <RiskScoreBadge score={task.riskScore} level={task.riskLevel} size="sm" />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No tasks found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-slate-900" />
                <span>Create New Task</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Build Payment Processing Checkout Module"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Project</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-Assignee Co-assignment Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-700">
                    Assign Employees ({formData.assignedTo.length} selected)
                  </label>
                  <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center space-x-1">
                    <Zap className="w-3 h-3" />
                    <span>Select 2+ to split workload</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {teamUsers.map((u) => {
                    const isSelected = formData.assignedTo.includes(u._id);
                    return (
                      <div
                        key={u._id}
                        onClick={() => toggleAssignee(u._id)}
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

                {formData.assignedTo.length > 1 && (
                  <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Workload Split Active:</strong> {formData.estimatedHours} total hours will be split into{' '}
                      <strong>{splitHours} hours each</strong> across {formData.assignedTo.length} team members!
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Effort (Hrs)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task instructions and expected deliverables..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-bold shadow-xs"
                >
                  Create & Balance Workload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
