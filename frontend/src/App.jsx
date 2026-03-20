import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import TopBar from './components/layout/TopBar';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import RiderHome from './pages/rider/Home';
import PolicyDetail from './pages/rider/PolicyDetail';
import Claims from './pages/rider/Claims';
import Earnings from './pages/rider/Earnings';
import AdminDashboard from './pages/admin/AdminDashboard';

/* ── Layout wrappers ─────────────────────────────────────────────── */
function RiderLayout() {
  const routeTitles = {
    '/rider': 'Home',
    '/rider/policy': 'Policy',
    '/rider/claims': 'Claims',
    '/rider/earnings': 'Earnings',
  };
  const title = routeTitles[window.location.pathname] || 'GigSecure';
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar title={title} />
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar title="Admin Dashboard" />
        <Outlet />
      </main>
    </div>
  );
}

/* ── Auth guards ─────────────────────────────────────────────────── */
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/rider" replace />;
  return children;
}

function AlreadyAuthed() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) return <Navigate to={isAdmin ? '/admin' : '/onboarding'} replace />;
  return null;
}

/* ── App Router ──────────────────────────────────────────────────── */
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<><AlreadyAuthed /><Landing /></>} />
      <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

      {/* Rider routes */}
      <Route path="/rider" element={<RequireAuth><RiderLayout /></RequireAuth>}>
        <Route index element={<RiderHome />} />
        <Route path="policy" element={<PolicyDetail />} />
        <Route path="claims" element={<Claims />} />
        <Route path="earnings" element={<Earnings />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<AdminDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
