import { NavLink, Outlet } from 'react-router-dom';
import { ShieldIcon, DashboardIcon, ScanIcon, ChatIcon } from './Icons';
import './Layout.css';

const links = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/verify', label: 'Verify Receipt', icon: ScanIcon },
  { to: '/advisor', label: 'Financial Advisor', icon: ChatIcon },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <ShieldIcon size={22} />
          </div>
          <div>
            <strong>MoMo Shield</strong>
            <span>Fraud Detection</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-dot" />
          <span>System active</span>
        </div>
      </aside>

      <div className="app-main">
        <header className="mobile-header">
          <div className="mobile-brand">
            <ShieldIcon size={20} />
            <strong>MoMo Shield</strong>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-nav">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={22} />
            <span>{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
