import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AlumniDashboard from './pages/AlumniDashboard';
import AlumniEngagements from './pages/AlumniEngagements';
import EmployerDashboard from './pages/EmployerDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/alumni" element={<AlumniDashboard />} />
          <Route path="/alumni-engagements" element={<AlumniEngagements />} />
          <Route path="/employer" element={<EmployerDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;