import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home';
import AlumniDashboard from './pages/AlumniDashboard';
import AlumniEngagements from './pages/AlumniEngagements';
import EmployerDashboard from './pages/EmployerDashboard';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Login from './pages/Login.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import PredictionsLayout from './pages/Predictions';
import AlumniPredictions from './pages/Predictions/AlumniPredictions.jsx';
import EmployerPredictions from './pages/Predictions/EmployerPredictions.jsx';
import './App.css';

function App() {
  // Set basename for GitHub Pages deployment
  // If deployed to root, use '/'. If to subdirectory, use '/repo-name/'
  const basename = import.meta.env.BASE_URL || '/';
  
  return (
    <Router basename={basename}>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute roles={['admin', 'alumni', 'employer']} />}>
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/events" element={<Events />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'alumni']} />}>
            <Route path="/alumni" element={<AlumniDashboard />} />
            <Route path="/alumni-engagements" element={<AlumniEngagements />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin', 'employer']} />}>
            <Route path="/employer" element={<EmployerDashboard />} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/predictions" element={<PredictionsLayout />}>
              <Route index element={<Navigate to="alumni" replace />} />
              <Route path="alumni" element={<AlumniPredictions />} />
              <Route path="employers" element={<EmployerPredictions />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;