import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import './App.css';

function App() {
  return (
    <Router>
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
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;