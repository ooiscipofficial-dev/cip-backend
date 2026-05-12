import { Link, useLocation } from 'react-router-dom';
import { clearSession } from '../../lib/authStore';
import { LogOut, LayoutGrid, Globe, Crown, Files, Calendar } from 'lucide-react';
import ThemeToggle from '../../components/layout/ThemeToggle';

export default function Navbar({ session }) {
  const location = useLocation();

  function handleLogout() {
    clearSession();
    window.location.href = '/';
  }

  const isPresident = String(session?.role || '').toLowerCase() === 'president';
  const isManager = String(session?.type || session?.role || '').toLowerCase() === 'manager';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight hover:opacity-80 transition-opacity">
          <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-sm bg-background" />
          </div>
          CouncilHub
        </Link>

        <nav className="hidden sm:flex items-center gap-1 text-xs">
          {isManager && (
            <>
              <NavLink to="/manager" label="Overview" current={location.pathname} icon={<LayoutGrid size={12} />} />
              <NavLink to="/calendar" label="Execution Calendar" current={location.pathname} icon={<Calendar size={12} />} />
              <NavLink to="/commons" label="Commons" current={location.pathname} icon={<Globe size={12} />} />
              <NavLink to="/files" label="File Wall" current={location.pathname} icon={<Files size={12} />} />
            </>
          )}
          {session?.type === 'member' && (
            <>
              <NavLink to={`/council/${session.councilId}`} label="My Council" current={location.pathname} icon={<LayoutGrid size={12} />} />
              <NavLink to="/calendar" label="Execution Calendar" current={location.pathname} icon={<Calendar size={12} />} />
              <NavLink to="/commons" label="Commons" current={location.pathname} icon={<Globe size={12} />} />
              <NavLink to="/files" label="File Wall" current={location.pathname} icon={<Files size={12} />} />
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              {isManager && <span className="tag flex items-center gap-0.5"><LayoutGrid size={9} /> Manager</span>}
              {isPresident && <span className="tag flex items-center gap-0.5"><Crown size={9} /> President</span>}
              <span>{session.name}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, label, current, icon }) {
  const active = current === to || current.startsWith(to + '/');
  return (
    <Link to={to} className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors
      ${active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
      {icon} {label}
    </Link>
  );
}
