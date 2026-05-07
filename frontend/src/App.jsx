import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TicketListPage from './pages/TicketListPage';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import AssetsPage from './pages/AssetsPage';
import { CategoriesPage, DepartmentsPage, SLARulesPage, AuditPage, ProfilePage } from './pages/AdminPages';
import './index.css';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="tickets" element={<TicketListPage />} />
        <Route path="tickets/create" element={<CreateTicketPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="knowledge" element={<KnowledgeBasePage />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* Staff routes */}
        <Route path="assets" element={<ProtectedRoute roles={['ADMIN', 'TEAM_LEADER', 'AGENT']}><AssetsPage /></ProtectedRoute>} />

        {/* Admin/Team Leader routes */}
        <Route path="users" element={<ProtectedRoute roles={['ADMIN', 'TEAM_LEADER']}><UsersPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute roles={['ADMIN', 'TEAM_LEADER']}><ReportsPage /></ProtectedRoute>} />

        {/* Admin only routes */}
        <Route path="categories" element={<ProtectedRoute roles={['ADMIN']}><CategoriesPage /></ProtectedRoute>} />
        <Route path="departments" element={<ProtectedRoute roles={['ADMIN']}><DepartmentsPage /></ProtectedRoute>} />
        <Route path="sla-rules" element={<ProtectedRoute roles={['ADMIN']}><SLARulesPage /></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute roles={['ADMIN']}><AuditPage /></ProtectedRoute>} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ThemedToaster() {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f1f5f9' : '#1e293b',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          borderRadius: '10px',
          fontSize: '0.85rem',
          boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
        },
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
            <ThemedToaster />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
