import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="bg-sluBlue text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold hover:text-sluGold transition-colors">
              DataNexus Dashboard
            </Link>
          </div>
          <div className="flex space-x-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-md transition-colors ${
                location.pathname === '/'
                  ? 'bg-sluGold text-sluBlue font-semibold'
                  : 'hover:bg-blue-700'
              }`}
            >
              🏠 Home
            </Link>
            <Link
              to="/alumni"
              className={`px-4 py-2 rounded-md transition-colors ${
                location.pathname === '/alumni'
                  ? 'bg-sluGold text-sluBlue font-semibold'
                  : 'hover:bg-blue-700'
              }`}
            >
              🎓 Alumni Dashboard
            </Link>
            <Link
              to="/alumni-engagements"
              className={`px-4 py-2 rounded-md transition-colors ${
                location.pathname === '/alumni-engagements'
                  ? 'bg-sluGold text-sluBlue font-semibold'
                  : 'hover:bg-blue-700'
              }`}
            >
              👥 Alumni Engagements
            </Link>
            <Link
              to="/employer"
              className={`px-4 py-2 rounded-md transition-colors ${
                location.pathname === '/employer'
                  ? 'bg-sluGold text-sluBlue font-semibold'
                  : 'hover:bg-blue-700'
              }`}
            >
              💼 Employer Dashboard
            </Link>
          </div>
        </div>
        <div className="h-1 bg-sluGold"></div>
      </div>
    </nav>
  );
};

export default Navbar;
