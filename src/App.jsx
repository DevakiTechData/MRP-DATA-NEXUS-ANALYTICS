import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ChatBot from './components/ChatBot';
import Home from './pages/Home';
import AlumniDashboard from './pages/AlumniDashboard';
import AlumniPortal from './pages/AlumniPortal';
import EmployerDashboard from './pages/EmployerDashboard';
import EmployerPortal from './pages/EmployerPortal';
import GalleryPage from './pages/GalleryPage';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

function App() {
  // Set basename for GitHub Pages deployment
  // If deployed to root, use '/'. If to subdirectory, use '/repo-name/'
  const basename = import.meta.env.BASE_URL || '/';
  const { user } = useAuth();
  
  return (
    <Router basename={basename}>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Alumni Dashboard - accessible to admin only */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/alumni" element={<AlumniDashboard />} />
          </Route>

          {/* Employer Dashboard - accessible to admin only */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/employer" element={<EmployerDashboard />} />
          </Route>

          {/* Alumni Portal - accessible to admin and alumni roles */}
          <Route element={<ProtectedRoute roles={['admin', 'alumni']} />}>
            <Route path="/alumni-portal" element={<AlumniPortal />} />
          </Route>

          {/* Employer Portal - accessible to admin and employer roles */}
          <Route element={<ProtectedRoute roles={['admin', 'employer']} />}>
            <Route path="/employer-portal" element={<EmployerPortal />} />
          </Route>

          {/* Admin Console - accessible to admin role only */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
        
        {/* Global ChatBot - only render when user is authenticated */}
        {user && <ChatBot />}
      </div>
    </Router>
  );
}

export default App;