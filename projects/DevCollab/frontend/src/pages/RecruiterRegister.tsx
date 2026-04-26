import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { User } from '../types';

export default function RecruiterRegister({ setUser }: { setUser: (user: User | null) => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', companyName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.registerRecruiter(form);
      await api.loginRecruiter(form.email, form.password);
      const user = await api.currentUser();
      setUser(user);
      navigate('/recruiter/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold mb-6 text-center">Recruiter Registration</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company Name</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-md font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Company Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-primary-600">Login</Link>
        </p>
      </div>
    </div>
  );
}