import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import type { Job, User } from '../types';

export default function JobsPage({ user }: { user: User | null }) {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    skills: searchParams.get('q') || '',
    location: searchParams.get('location') || '',
    locationType: '',
  });

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      let filter = 'status = "active"';
      if (filters.skills) {
        filter += ` && skills ~ "${filters.skills}"`;
      }
      if (filters.location) {
        filter += ` && location ~ "${filters.location}"`;
      }
      if (filters.locationType) {
        filter += ` && locationType = "${filters.locationType}"`;
      }
      const data = await api.getJobs(filter, 1, 50);
      setJobs(data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Find Your Next Role</h1>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search skills..."
              value={filters.skills}
              onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
              className="px-3 py-2 border rounded-md"
            />
            <input
              type="text"
              placeholder="Location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="px-3 py-2 border rounded-md"
            />
            <select
              value={filters.locationType}
              onChange={(e) => setFilters({ ...filters, locationType: e.target.value })}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Types</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
            <button
              onClick={loadJobs}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No jobs found</div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="block bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <p className="text-gray-600">{job.company}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm">{job.locationType}</span>
                    {job.location && (
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">{job.location}</span>
                    )}
                  </div>
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {job.skills.slice(0, 5).map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {job.salaryMin && job.salaryMax && (
                    <p className="font-semibold">
                      {job.currency} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">{job.applicantCount} applicants</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}