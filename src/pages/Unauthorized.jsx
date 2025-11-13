import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-10 space-y-6 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sluGold text-sluBlue text-xl font-bold">
          !
        </div>
        <h1 className="text-2xl font-semibold text-sluBlue">Access Restricted</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Your current role does not have permission to view this page. If you believe this is an
          error, please contact the DataNexus administrator.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-sluBlue text-white px-5 py-2 text-sm font-semibold shadow hover:bg-sluBlue/90 transition"
          >
            Go to Home
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg border border-sluBlue px-5 py-2 text-sm font-semibold text-sluBlue hover:bg-sluBlue/10 transition"
          >
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

