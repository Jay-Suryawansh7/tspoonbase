import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Application, Job } from '../types';

interface AppWithJob extends Application {
  jobData?: Job;
}

export default function CandidateDashboard() {
  const [applications, setApplications] = useState<AppWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    try {
      const data = await api.getApplications();
      const apps = await Promise.all(
        data.items.map(async (app) => {
          const job = await api.getJob(app.job);
          return { ...app, jobData: job };
        })
      );
      setApplications(apps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const stages = ['applied', 'screening', 'interview', 'offer', 'rejected', 'hired'];
  const stageColors: Record<string, string> = {
    applied: 'bg-blue-100 text-blue-800',
    screening: 'bg-yellow-100 text-yellow-800',
    interview: 'bg-purple-100 text-purple-800',
    offer: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    hired: 'bg-green-200 text-green-900',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Applications</h1>
        <Link to="/jobs" className="text-primary-600 hover:underline">
          Browse More Jobs
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border p-8">
          <p className="text-gray-500 mb-4">You haven't applied to any jobs yet.</p>
          <Link to="/jobs" className="text-primary-600 hover:underline">
            Find jobs to apply to
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <Link
              key={app.id}
              to={`/jobs/${app.job}`}
              className="block bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{app.jobData?.title}</h3>
                  <p className="text-gray-600">{app.jobData?.company}</p>
                </div>
                <div className="text-right">
                  {app.matchScore !== undefined && (
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-primary-600">{app.matchScore}%</span>
                      <span className="text-sm text-gray-500"> match</span>
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${stageColors[app.stage]}`}>
                    {app.stage}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Applied {new Date(app.appliedAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}