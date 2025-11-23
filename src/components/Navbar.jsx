import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINK_GROUPS = [
  {
    group: 'Dashboards',
    items: [
      { to: '/alumni', label: 'Alumni Dashboard', roles: ['admin'] },
      { to: '/employer', label: 'Employer Dashboard', roles: ['admin'] },
    ],
  },
  {
    group: 'Alumni',
    items: [
      { to: '/alumni-portal', label: 'Alumni Portal', roles: ['admin', 'alumni'] },
    ],
  },
  {
    group: 'Employer',
    items: [
      { to: '/employer-portal', label: 'Employer Portal', roles: ['admin', 'employer'] },
    ],
  },
  {
    group: 'Admin',
    items: [
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
      {/* Main Navigation Bar */}
      <div className="bg-gradient-to-r from-sluBlue via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Branding */}
            <Link to="/" className="flex items-center gap-4 flex-shrink-0">
              <div className="relative">
                <img
                  src="/assets/slu-logo.png"
                  alt="Saint Louis University Logo"
                  className="h-20 w-20 object-contain drop-shadow-lg"
                  style={{
                    imageRendering: 'auto',
                    WebkitImageRendering: 'auto',
                    maxWidth: '80px',
                    maxHeight: '80px',
                    minWidth: '80px',
                    minHeight: '80px',
                    filter: 'brightness(1.1) contrast(1.05)',
                  }}
                  onError={(e) => {
                    // Fallback to styled text logo if image fails to load
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
                {/* Fallback text logo if image fails */}
                <div
                  className="hidden h-20 w-20 items-center justify-center rounded-full bg-white text-sluBlue font-bold text-xl shadow-lg"
                  style={{ display: 'none' }}
                >
                  SLU
                </div>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-bold leading-tight uppercase tracking-tight">
                  SAINT LOUIS UNIVERSITY
                </span>
                <span className="text-xs font-medium text-white/90 uppercase tracking-wider">
                  DataNexus Dashboard
                </span>
              </div>
            </Link>

            {/* Main Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center px-8">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:text-sluGold transition-colors ${
                    isActive ? 'text-sluGold border-b-2 border-sluGold' : 'text-white'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/gallery"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:text-sluGold transition-colors ${
                    isActive ? 'text-sluGold border-b-2 border-sluGold' : 'text-white'
                  }`
                }
              >
                Gallery
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-semibold uppercase tracking-wide hover:text-sluGold transition-colors ${
                    isActive ? 'text-sluGold border-b-2 border-sluGold' : 'text-white'
                  }`
                }
              >
                Contact
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
                    className={`px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors inline-flex items-center gap-1 ${
                      hoverGroup === group.group || group.items.some(item => isActive(item.to))
                        ? 'text-sluGold border-b-2 border-sluGold'
                        : 'text-white hover:text-sluGold'
                    }`}
                  >
                    {group.group}
                    <span className="text-xs">▼</span>
                  </button>
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 mt-2 w-64 rounded-lg border border-slate-200 bg-white shadow-xl transition-all duration-200 ${
                      hoverGroup === group.group ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                    }`}
                  >
                    <div className="p-3 space-y-1">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            isActive(item.to)
                              ? 'bg-sluBlue text-white'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-sluBlue'
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

            {/* Right Side Actions */}
            <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/80 px-3 py-1.5 bg-white/10 rounded-full">
                    {role}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-semibold text-white border border-white/40 rounded-full hover:bg-white/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-white border border-white/40 rounded-full hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
              )}
              <button
                type="button"
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Search"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle navigation"
            >
              <span className="sr-only">Toggle navigation</span>
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden border-b border-slate-200 bg-white transition-all duration-200 ${
          menuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'
        }`}
      >
        <div className="px-4 py-4 space-y-3">
          <div className="pb-3 border-b border-slate-200">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2 font-semibold">Main Navigation</p>
            {[
              { to: '/', label: 'Home' },
              { to: '/gallery', label: 'Gallery' },
              { to: '/contact', label: 'Contact' },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive: active }) =>
                  `block rounded-md px-3 py-2 text-base font-medium transition-colors ${
                    active
                      ? 'bg-sluBlue text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-sluBlue'
                  }`
                }
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          {visibleGroups.map((group) => (
            <div key={group.group} className="pb-3 border-b border-slate-200 last:border-0">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2 font-semibold">
                {group.group}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
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
          {isAuthenticated && user?.username && (
            <div className="pt-3 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                Signed in as <span className="font-semibold text-slate-700">{user.username}</span>
                <span className="mx-2 text-slate-400">•</span>
                <span className="uppercase tracking-wide text-slate-600">{role}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
