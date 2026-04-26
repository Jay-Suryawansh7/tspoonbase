import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { api } from './utils/api';
import type { User } from './types';

// Pages
import Landing from './pages/Landing';
import JobsPage from './pages/JobsPage';
import JobDetail from './pages/JobDetail';
import CandidateRegister from './pages/CandidateRegister';
import CandidateDashboard from './pages/CandidateDashboard';
import CandidateProfile from './pages/CandidateProfile';
import RecruiterRegister from './pages/RecruiterRegister';
import RecruiterDashboard from './pages/RecruiterDashboard';
import RecruiterJobDetail from './pages/RecruiterJobDetail';
import RecruiterAnalytics from './pages/RecruiterAnalytics';
import LoginPage from './pages/LoginPage';

function Navbar({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const location = useLocation();
  const isCandidate = user?.collection === 'candidates';
  const isRecruiter = user?.collection === 'recruiters';

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-primary-600">
              NeuralHire
            </Link>
            {user && (
              <div className="ml-8 flex space-x-4">
                <Link
                  to="/jobs"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.startsWith('/jobs')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Jobs
                </Link>
                {isCandidate && (
                  <>
                    <Link
                      to="/candidates/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        location.pathname.includes('dashboard')
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      My Applications
                    </Link>
                    <Link
                      to="/candidates/profile"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        location.pathname.includes('profile')
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Profile
                    </Link>
                  </>
                )}
                {isRecruiter && (
                  <>
                    <Link
                      to="/recruiter/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        location.pathname.includes('dashboard')
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/recruiter/analytics"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        location.pathname.includes('analytics')
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Analytics
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {!user ? (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm">
                  Login
                </Link>
                <Link
                  to="/candidates/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  Candidate Sign Up
                </Link>
                <Link
                  to="/recruiter/register"
                  className="border border-primary-600 text-primary-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-50"
                >
                  Recruiter Sign Up
                </Link>
              </>
            ) : (
              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute({
  user,
  type,
  children,
}: {
  user: User | null;
  type: 'candidate' | 'recruiter';
  children: React.ReactNode;
}) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (type === 'candidate' && user.collection !== 'candidates') {
    return <Navigate to="/recruiter/dashboard" replace />;
  }
  if (type === 'recruiter' && user.collection !== 'recruiters') {
    return <Navigate to="/candidates/dashboard" replace />;
  }
  return <>{children}</>;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.currentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/jobs" element={<JobsPage user={user} />} />
          <Route path="/jobs/:id" element={<JobDetail user={user} />} />
          <Route path="/candidates/register" element={<CandidateRegister setUser={setUser} />} />
          <Route
            path="/candidates/dashboard"
            element={
              <ProtectedRoute user={user} type="candidate">
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/candidates/profile"
            element={
              <ProtectedRoute user={user} type="candidate">
                <CandidateProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/recruiter/register" element={<RecruiterRegister setUser={setUser} />} />
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute user={user} type="recruiter">
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/:id"
            element={
              <ProtectedRoute user={user} type="recruiter">
                <RecruiterJobDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/analytics"
            element={
              <ProtectedRoute user={user} type="recruiter">
                <RecruiterAnalytics />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;