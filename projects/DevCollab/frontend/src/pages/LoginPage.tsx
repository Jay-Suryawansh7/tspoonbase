import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { User } from '../types';

export default function LoginPage({ setUser }: { setUser: (user: User | null) => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (role === 'candidate') {
        await api.loginCandidate(form.email, form.password);
      } else {
        await api.loginRecruiter(form.email, form.password);
      }
      const user = await api.currentUser();
      setUser(user);
      navigate(user?.collection === 'recruiters' ? '/recruiter/dashboard' : '/candidates/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold mb-6 text-center">Login to NeuralHire</h1>
        
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setRole('candidate')}
            className={`flex-1 py-2 rounded-md ${
              role === 'candidate'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Candidate
          </button>
          <button
            type="button"
            onClick={() => setRole('recruiter')}
            className={`flex-1 py-2 rounded-md ${
              role === 'recruiter'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Recruiter
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          {role === 'candidate' ? (
            <>
              New candidate? <Link to="/candidates/register" className="text-primary-600">Sign up</Link>
            </>
          ) : (
            <>
              New recruiter? <Link to="/recruiter/register" className="text-primary-600">Sign up</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}