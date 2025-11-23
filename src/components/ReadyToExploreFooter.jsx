import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ReadyToExploreFooter = () => {
  const { role } = useAuth();
  const canViewDashboards = role === 'admin';

  return (
    <div className="bg-gradient-to-r from-sluBlue to-blue-800 rounded-lg shadow-lg p-12 text-white text-center">
      <h2 className="text-4xl font-bold mb-4">Ready to Explore?</h2>
      <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
        Dive into detailed analytics and insights about our alumni network and employer partnerships. 
        Discover trends, patterns, and opportunities that drive success.
      </p>
      {canViewDashboards ? (
        <div className="flex justify-center gap-4">
          <Link
            to="/alumni"
            className="bg-sluGold text-sluBlue px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Alumni Dashboard
          </Link>
          <Link
            to="/employer"
            className="bg-white text-sluBlue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Employer Dashboard
          </Link>
        </div>
      ) : (
        <div className="flex justify-center gap-4">
          {role === 'alumni' && (
            <Link
              to="/alumni-portal"
              className="bg-sluGold text-sluBlue px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
            >
              Alumni Portal
            </Link>
          )}
          {role === 'employer' && (
            <Link
              to="/employer-portal"
              className="bg-white text-sluBlue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Employer Portal
            </Link>
          )}
          {!role && (
            <Link
              to="/contact"
              className="bg-sluGold text-sluBlue px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
            >
              Contact Us
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ReadyToExploreFooter;

