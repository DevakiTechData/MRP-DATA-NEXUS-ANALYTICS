import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const { login, isAuthenticated, error, clearError, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formState, setFormState] = useState({ username: '', password: '' });
  const [formError, setFormError] = useState(null);

  const redirectTo = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  useEffect(() => {
    if (error) {
      setFormError(error);
    }
  }, [error]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    clearError();
    try {
      await login(formState.username.trim(), formState.password);
    } catch (err) {
      setFormError(err.message || 'Login failed.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/assets/hero/campus img1.jpg"
          alt="Saint Louis University campus"
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-sluBlue/90 via-sluBlue/70 to-slate-900/70 mix-blend-multiply" />
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full mx-auto bg-white/95 border border-slate-200 rounded-3xl shadow-2xl p-8 space-y-6 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sluBlue text-white text-xl font-bold shadow-lg shadow-sluBlue/40">
              SLU
            </div>
            <h1 className="text-2xl font-semibold text-sluBlue">DataNexus Login</h1>
            <p className="text-sm text-slate-500">
              Enter your credentials to access the dashboards and admin tools.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={formState.username}
                onChange={(event) => setFormState((prev) => ({ ...prev, username: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sluBlue/50"
                placeholder="admin"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-600" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formState.password}
                onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sluBlue/50"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-lg bg-sluBlue text-white px-4 py-2 text-sm font-semibold shadow hover:bg-sluBlue/90 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-xs text-slate-400 text-center space-y-2">
            <p>Admin: admin / admin123</p>
            <p>Alumni: alumni / alumni123</p>
            <p>Employer: employer / employer123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
