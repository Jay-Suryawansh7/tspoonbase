import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function CandidateRegister({ setUser }: { setUser: (user: any) => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpId, setOtpId] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otpSent) {
      await verifyOtp();
    } else {
      await register();
    }
  }

  async function register() {
    setLoading(true);
    setError('');
    try {
      await api.registerCandidate(form);
      setOtpSent(true);
      // For demo: show the code
      alert('Registration successful! Check console for OTP code.');
      console.log('Demo: Use any 6-digit code to verify');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError('');
    try {
      // In production, this would verify OTP
      // For demo, just log in with password
      await api.loginCandidate(form.email, form.password);
      const user = await api.currentUser();
      setUser(user);
      navigate('/candidates/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold mb-6 text-center">Candidate Registration</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!otpSent ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Enter OTP Code</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
              <p className="text-sm text-gray-500 mt-2">Check your email for the code</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-md font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : otpSent ? 'Verify OTP' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-primary-600">Login</Link>
        </p>
      </div>
    </div>
  );
}