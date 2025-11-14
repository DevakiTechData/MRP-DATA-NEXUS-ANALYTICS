import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_LINK_GROUPS = [
  {
    group: 'Dashboards',
    items: [
      { to: '/alumni', label: 'Alumni Dashboard', roles: ['admin', 'alumni'] },
      { to: '/employer', label: 'Employer Dashboard', roles: ['admin', 'employer'] },
    ],
  },
  {
    group: 'Community',
    items: [
      { to: '/gallery', label: 'Gallery', roles: ['admin', 'alumni', 'employer'] },
      { to: '/alumni-engagements', label: 'Alumni Engagements', roles: ['admin', 'alumni'] },
      { to: '/events', label: 'Events', roles: ['admin', 'alumni', 'employer'] },
    ],
  },
  {
    group: 'Insights',
    items: [
      { to: '/predictions/alumni', label: 'Predictive Outlook', roles: ['admin'] },
    ],
  },
  {
    group: 'Connect',
    items: [
      { to: '/contact', label: 'Contact', roles: ['admin', 'alumni', 'employer'] },
      { to: '/admin', label: 'Admin Console', roles: ['admin'] },
    ],
  },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverGroup, setHoverGroup] = useState(null);

  const isActive = (path) => location.pathname === path;

  const visibleGroups = NAV_LINK_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return isAuthenticated && item.roles.includes(role);
    }),
  })).filter((group) => group.items.length > 0);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow">
      <div className="bg-gradient-to-r from-sluBlue/95 via-sluBlue/90 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-sluBlue font-semibold shadow">
                SLU
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold leading-tight">DataNexus Dashboard</span>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-200">
                  Analytics &amp; Engagement
                </span>
              </div>
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              <NavLink
                to="/"
                className={({ isActive: active }) =>
                  [
                    'text-sm font-semibold uppercase tracking-wide',
                    active
                      ? 'text-white border-b-2 border-sluGold pb-1'
                      : 'text-slate-100 hover:text-sluGold',
                  ].join(' ')
                }
              >
                Home
              </NavLink>
              {visibleGroups.map((group) => (
                <div
                  key={group.group}
                  className="relative"
                  onMouseEnter={() => setHoverGroup(group.group)}
                  onMouseLeave={() => setHoverGroup(null)}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-slate-100 hover:text-sluGold"
                  >
                    {group.group}
                    <span className="text-xs">&#9662;</span>
                  </button>
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 mt-3 w-64 rounded-lg border border-slate-200 bg-white shadow-lg transition-all duration-150 ${
                      hoverGroup === group.group ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                    }`}
                  >
                    <div className="p-4 space-y-2">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={`block rounded-md px-3 py-2 text-sm font-medium ${
                            isActive(item.to)
                              ? 'bg-sluBlue text-white'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-sluBlue'
                          }`}
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </nav>
            <div className="hidden lg:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-200">
                    {role}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition"
                >
                  Sign In
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center rounded-md border border-white/40 px-3 py-2 text-white"
            >
              <span className="sr-only">Toggle navigation</span>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`lg:hidden border-b border-slate-200 bg-white transition-all duration-200 ${
          menuOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'
        }`}
      >
        <div className="px-4 py-4 space-y-4">
          <NavLink
            to="/"
            className={({ isActive: active }) =>
              [
                'block rounded-md px-3 py-2 text-base font-medium',
                active ? 'bg-sluBlue text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-sluBlue',
              ].join(' ')
            }
            onClick={() => setMenuOpen(false)}
          >
            Home
          </NavLink>
          {visibleGroups.map((group) => (
            <div key={group.group}>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">{group.group}</p>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`block rounded-md px-3 py-2 text-sm font-medium ${
                      isActive(item.to)
                        ? 'bg-sluBlue text-white'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-sluBlue'
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-4 border-t border-slate-200">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center rounded-lg bg-sluBlue text-white px-4 py-2 text-sm font-semibold shadow hover:bg-sluBlue/90 transition"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="w-full inline-flex items-center justify-center rounded-lg bg-sluBlue text-white px-4 py-2 text-sm font-semibold shadow hover:bg-sluBlue/90 transition"
              >
                Sign In
              </Link>
            )}
          </div>
          {isAuthenticated && user?.username && (
            <p className="text-center text-xs text-slate-400">
              Signed in as <span className="font-semibold text-slate-500">{user.username}</span>
            </p>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
