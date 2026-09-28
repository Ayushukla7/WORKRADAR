import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';

// Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import RiskCenterPage from './pages/manager/RiskCenterPage';
import ProjectsPage from './pages/manager/ProjectsPage';
import TasksPage from './pages/manager/TasksPage';
import TaskDetailsManagerPage from './pages/manager/TaskDetailsManagerPage';
import WorkloadAnalyticsPage from './pages/manager/WorkloadAnalyticsPage';
import ExtensionsPage from './pages/manager/ExtensionsPage';
import TeamPage from './pages/manager/TeamPage';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import MyTasksPage from './pages/employee/MyTasksPage';
import MyWorkloadPage from './pages/employee/MyWorkloadPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Manager Routes */}
          <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
            <Route element={<AppLayout />}>
              <Route path="/manager/dashboard" element={<ManagerDashboard />} />
              <Route path="/manager/risk-center" element={<RiskCenterPage />} />
              <Route path="/manager/projects" element={<ProjectsPage />} />
              <Route path="/manager/tasks" element={<TasksPage />} />
              <Route path="/manager/tasks/:id" element={<TaskDetailsManagerPage />} />
              <Route path="/manager/workload" element={<WorkloadAnalyticsPage />} />
              <Route path="/manager/extensions" element={<ExtensionsPage />} />
              <Route path="/manager/team" element={<TeamPage />} />
            </Route>
          </Route>

          {/* Protected Employee Routes */}
          <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
            <Route element={<AppLayout />}>
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
              <Route path="/employee/tasks" element={<MyTasksPage />} />
              <Route path="/employee/workload" element={<MyWorkloadPage />} />
              <Route path="/employee/extensions" element={<ExtensionsPage />} />
            </Route>
          </Route>

          {/* Catch All Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
