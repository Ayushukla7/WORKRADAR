import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FolderKanban, Plus, RefreshCw, Calendar, Users, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamMembers: [],
    targetEndDate: '',
  });

  const fetchProjectsData = async () => {
    setLoading(true);
    try {
      const [projRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/auth/users'),
      ]);

      if (projRes.data.success) {
        setProjects(projRes.data.projects);
      }
      if (usersRes.data.success) {
        setTeamUsers(usersRes.data.users);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/projects', formData);
      if (response.data.success) {
        setShowCreateModal(false);
        setFormData({ name: '', description: '', teamMembers: [], targetEndDate: '' });
        fetchProjectsData();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create project');
    }
  };

  const toggleTeamMember = (userId) => {
    setFormData((prev) => {
      const exists = prev.teamMembers.includes(userId);
      return {
        ...prev,
        teamMembers: exists
          ? prev.teamMembers.filter((id) => id !== userId)
          : [...prev.teamMembers, userId],
      };
    });
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center space-x-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
        <span className="text-sm font-medium">Loading project portfolio...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Projects Portfolio</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage projects, assign team members, and track completion progress.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-xs w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.length > 0 ? (
          projects.map((project) => (
            <div
              key={project._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-extrabold text-slate-900 leading-tight">{project.name}</h3>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {project.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{project.description}</p>
              </div>

              {/* Progress Bar & Key Counts */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Completion Progress</span>
                  <span className="font-mono text-slate-900 font-bold">{project.completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-slate-900 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${project.completionPercentage}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs border-t border-slate-200 mt-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Tasks</span>
                    <span className="font-mono text-slate-900 font-bold">{project.totalTasks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Completed</span>
                    <span className="font-mono text-emerald-700 font-bold">{project.completedTasks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">At Risk</span>
                    <span className="font-mono text-rose-700 font-bold">{project.atRiskTasks}</span>
                  </div>
                </div>
              </div>

              {/* Footer info & Team Members */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                <div className="flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{project.teamMembers?.length || 0} Team Members</span>
                </div>

                <div className="flex items-center space-x-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Due: {project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            No projects created yet. Click "Create New Project" above.
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FolderKanban className="w-5 h-5 text-slate-900" />
                <span>Create New Project</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Fintech Payment Integration"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief overview of project goals..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={formData.targetEndDate}
                  onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Assign Team Members</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {teamUsers.map((user) => {
                    const isSelected = formData.teamMembers.includes(user._id);
                    return (
                      <div
                        key={user._id}
                        onClick={() => toggleTeamMember(user._id)}
                        className={`p-2 rounded-lg cursor-pointer border transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-semibold text-xs truncate">{user.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                      </div>
                    );
                  })}
                </div>
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
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
