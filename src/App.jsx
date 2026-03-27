import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Tasks from './pages/Tasks';
import Collaboration from './pages/Collaboration';
import TeacherAttendance from './pages/TeacherAttendance';
import StudentAttendance from './pages/StudentAttendance';
import Assessments from './pages/Assessments';
import Campaigns from './pages/Campaigns';
import AdminPanel from './pages/AdminPanel';
import ManageUsers from './pages/ManageUsers';
import ManageClasses from './pages/ManageClasses';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text-light)',
        fontSize: '16px',
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, logout } = useAuth();

  const pageTitles = {
    '/dashboard': 'Dashboard',
    '/teachers': 'Teachers',
    '/tasks': 'Task Management',
    '/collaboration': 'Collaboration Hub',
    '/attendance/teachers': 'Teacher Attendance',
    '/attendance/students': 'Student Attendance',
    '/assessments': 'Student Assessments',
    '/campaigns': 'Campaign Tracker',
    '/admin': 'Admin Panel',
    '/manage-users': 'Manage Users',
    '/manage-classes': 'Classes & Students',
  };

  const adminPaths = ['/admin', '/manage-users', '/manage-classes'];

  const withLayout = (Component, path) => (
    <ProtectedRoute adminOnly={adminPaths.includes(path)}>
      <Layout
        pageTitle={pageTitles[path]}
        user={user}
        onLogout={() => {
          logout();
          window.location.href = '/login';
        }}
      >
        <Component />
      </Layout>
    </ProtectedRoute>
  );

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={withLayout(Dashboard, '/dashboard')} />
      <Route path="/teachers" element={withLayout(Teachers, '/teachers')} />
      <Route path="/tasks" element={withLayout(Tasks, '/tasks')} />
      <Route path="/collaboration" element={withLayout(Collaboration, '/collaboration')} />
      <Route path="/attendance/teachers" element={withLayout(TeacherAttendance, '/attendance/teachers')} />
      <Route path="/attendance/students" element={withLayout(StudentAttendance, '/attendance/students')} />
      <Route path="/assessments" element={withLayout(Assessments, '/assessments')} />
      <Route path="/campaigns" element={withLayout(Campaigns, '/campaigns')} />
      <Route path="/admin" element={withLayout(AdminPanel, '/admin')} />
      <Route path="/manage-users" element={withLayout(ManageUsers, '/manage-users')} />
      <Route path="/manage-classes" element={withLayout(ManageClasses, '/manage-classes')} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
