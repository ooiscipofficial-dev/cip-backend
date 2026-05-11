import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { getSession } from '../src/lib/authStore';
import Auth from '../src/pages/Auth';
import ManagerDashboard from '../src/pages/ManagerDashboard';
import CouncilPage from '../src/pages/CouncilPage';
import Commons from '../src/pages/Commons';
import CommonFileWall from '../src/pages/CommonFileWall';
import GlobalCalendarPage from '../src/pages/GlobalCalendarPage';
import { getTheme } from '../src/lib/dataStore';

if (getTheme() === 'dark') document.documentElement.classList.add('dark');

// 1. IMPROVED RequireAuth
function RequireAuth({ children, allowedTypes }) {
  const session = getSession();
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Double check your session object: is it .type or .role?
  // Based on your previous Worker code, it might be session.role
  const userType = session.type || session.role; 

  if (allowedTypes && !allowedTypes.includes(userType)) {
    return <Navigate to="/auth" replace />;
  }

  return children(session);
}

function App() {
  // We remove 'const session = getSession()' from here to prevent stale state loops

  return (
    <Router>
      <Routes>
        {/* Auth Page: Only accessible if NOT logged in */}
        <Route path="/auth" element={<Auth />} />

        {/* Manager Dashboard */}
        <Route path="/manager" element={
          <RequireAuth allowedTypes={['manager']}>
            {(session) => <ManagerDashboard session={session} />}
          </RequireAuth>
        } />

        {/* Council page */}
        <Route path="/council/:councilId" element={
          <RequireAuth allowedTypes={['member', 'manager']}>
            {(session) => <CouncilPage session={session} />}
          </RequireAuth>
        } />

        {/* Commons */}
        <Route path="/commons" element={
          <RequireAuth allowedTypes={['member', 'manager']}>
            {(session) => <Commons session={session} />}
          </RequireAuth>
        } />

        {/* Common File Wall */}
        <Route path="/files" element={
          <RequireAuth allowedTypes={['member', 'manager']}>
            {(session) => <CommonFileWall session={session} />}
          </RequireAuth>
        } />

        {/* Global Calendar */}
        <Route path="/calendar" element={
          <RequireAuth allowedTypes={['member', 'manager']}>
            {(session) => <GlobalCalendarPage session={session} />}
          </RequireAuth>
        } />

        {/* Root Logic & Catch-all */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// 2. NEW: RootRedirect component handles the logic without looping
function RootRedirect() {
  const session = getSession();
  if (!session) return <Navigate to="/auth" replace />;
  
  const userType = session.type || session.role;
  if (userType === 'manager') return <Navigate to="/manager" replace />;
  
  return <Navigate to={`/council/${session.councilId}`} replace />;
}

export default App;