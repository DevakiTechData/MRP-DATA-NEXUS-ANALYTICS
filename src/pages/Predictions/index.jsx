import { NavLink, Outlet } from 'react-router-dom';
import AssistantChat from '../../components/AssistantChat.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const PredictionsLayout = () => {
  const { role } = useAuth();
  const showAssistant = Boolean(role);
  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-4xl font-bold text-sluBlue">Predictive Outlook</h1>
          <p className="mt-3 text-base text-slate-600 max-w-3xl">
            Forward-looking insights for alumni engagement and employer hiring performance.
            These projections combine recent KPIs, funnel conversion metrics, and retention models to
            highlight emerging risks and opportunities.
          </p>
          <div className="mt-8 flex gap-4">
            <NavLink
              to="alumni"
              className={({ isActive }) =>
                `rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-sluBlue bg-sluBlue text-white shadow'
                    : 'border-slate-200 bg-white text-sluBlue hover:border-sluBlue/60'
                }`
              }
            >
              Alumni Forecasts
            </NavLink>
            <NavLink
              to="employers"
              className={({ isActive }) =>
                `rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-sluBlue bg-sluBlue text-white shadow'
                    : 'border-slate-200 bg-white text-sluBlue hover:border-sluBlue/60'
                }`
              }
            >
              Employer Forecasts
            </NavLink>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10">
        <Outlet />
      </div>
      {showAssistant && (
        // AssistantChat ships with a curated analytics knowledge base tailored to dashboard insights.
        <AssistantChat />
      )}
    </div>
  );
};

export default PredictionsLayout;
