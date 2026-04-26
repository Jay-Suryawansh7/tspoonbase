import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import type { Job, Recruiter } from '../types';

export default function RecruiterDashboard() {
  const [profile, setProfile] = useState<Recruiter | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [newApps, setNewApps] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();
  const eventRef = useRef<EventSource | null>(null);

  useEffect(() => {
    loadData();
    setupSSE();
    return () => {
      if (eventRef.current) eventRef.current.close();
    };
  }, []);

  async function loadData() {
    try {
      const [p, j] = await Promise.all([
        api.getRecruiterProfile(),
        api.getMyJobs(),
      ]);
      setProfile(p);
      setJobs(j.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function setupSSE() {
    eventRef.current = api.subscribeToSSE((data) => {
      if (data.type === 'new_application') {
        setNewApps((prev) => prev + 1);
      }
    });
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{profile?.companyName}</h1>
          <p className="text-gray-600 capitalize">{profile?.plan} Plan</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700"
        >
          Post New Job
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-3xl font-bold">{profile?.jobPostsUsed || 0}</div>
          <div className="text-gray-600">Jobs Posted</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-3xl font-bold">{jobs.reduce((sum, j) => sum + j.applicantCount, 0)}</div>
          <div className="text-gray-600">Total Applicants</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-3xl font-bold text-green-600">{newApps}</div>
          <div className="text-gray-600">New Today</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Your Jobs</h2>
        </div>
        {jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No jobs posted yet. Post your first job to start receiving applications.
          </div>
        ) : (
          <div className="divide-y">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/recruiter/jobs/${job.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{job.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        job.status === 'active' ? 'bg-green-100 text-green-800' :
                        job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                      <span className="text-sm text-gray-500">{job.applicantCount} applicants</span>
                    </div>
                  </div>
                  <div className="text-gray-500">
                    {new Date(job.postedAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateJobModal onClose={() => setShowCreate(false)} onCreated={() => {
          setShowCreate(false);
          loadData();
        }} />
      )}
    </div>
  );
}

function CreateJobModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', requirements: '',
    salaryMin: '', salaryMax: '', currency: 'USD',
    locationType: 'remote', location: '', skills: [] as string[],
    status: 'active',
  });
  const [loading, setLoading] = useState(false);

  const skillOptions = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'React', 'Vue', 'Angular',
    'Node.js', 'Django', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP',
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createJob({
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        salaryMin: form.salaryMin ? parseInt(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? parseInt(form.salaryMax) : undefined,
        currency: form.currency as any,
        locationType: form.locationType as any,
        location: form.location,
        skills: form.skills,
        status: form.status as any,
      });
      onCreated();
    } catch (e) {
      alert('Failed to create job');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Post New Job</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Job Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Requirements</label>
            <textarea
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Salary Min</label>
              <input
                type="number"
                value={form.salaryMin}
                onChange={(e) => setForm({ ...form, salaryMin: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Salary Max</label>
              <input
                type="number"
                value={form.salaryMax}
                onChange={(e) => setForm({ ...form, salaryMax: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location Type</label>
              <select
                value={form.locationType}
                onChange={(e) => setForm({ ...form, locationType: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Skills</label>
            <div className="flex gap-2 flex-wrap">
              {skillOptions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => {
                    const skills = form.skills.includes(skill)
                      ? form.skills.filter((s) => s !== skill)
                      : [...form.skills, skill];
                    setForm({ ...form, skills });
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    form.skills.includes(skill)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border py-2 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white py-2 rounded-md font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}