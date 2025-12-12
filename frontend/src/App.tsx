import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SignedIn, UserButton } from "@clerk/clerk-react";
import Landing from './pages/Landing';
import HRDashboard from './pages/HRDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentLogin from "./pages/StudentLogin";
import StudentSignup from "./pages/StudentSignup";
import HRLogin from "./pages/HRLogin";
import HRSignup from "./pages/HRSignup";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        {/* Minimal Header - Only shows on dashboards */}
        <header className="p-4 bg-white shadow flex justify-between items-center">
          <h1 className="font-bold text-xl text-orange-600">Hireflow</h1>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </header>

        <Routes>
          {/* Landing - Redirects based on role */}
          <Route path="/" element={<Landing />} />

          {/* HR Routes - COMPLETELY SEPARATE */}
          <Route path="/hr-login" element={<HRLogin />} />
          <Route path="/hr-signup" element={<HRSignup />} />
          <Route path="/hr-dashboard" element={<HRDashboard />} />

          {/* Student Routes - COMPLETELY SEPARATE */}
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/student-signup" element={<StudentSignup />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
