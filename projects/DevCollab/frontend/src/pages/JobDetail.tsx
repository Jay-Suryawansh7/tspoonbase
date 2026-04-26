import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Job, User } from '../types';

export default function JobDetail({ user }: { user: User | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    if (id) {
      api.getJob(id).then((j) => {
        setJob(j);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [id]);

  async function handleApply() {
    if (!user) {
      navigate('/candidates/register');
      return;
    }
    if (!id) return;
    setApplying(true);
    try {
      await api.applyToJob(id, coverLetter);
      alert('Application submitted!');
      navigate('/candidates/dashboard');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!job) return <div className="p-8 text-center">Job not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <p className="text-xl text-gray-600">{job.company}</p>
          </div>
          {user?.collection === 'candidates' && (
            <button
              onClick={handleApply}
              disabled={applying}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {applying ? 'Applying...' : 'Apply Now'}
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <span className="text-gray-500">Location Type</span>
            <p className="font-medium capitalize">{job.locationType}</p>
          </div>
          {job.location && (
            <div>
              <span className="text-gray-500">Location</span>
              <p className="font-medium">{job.location}</p>
            </div>
          )}
          {job.salaryMin && job.salaryMax && (
            <div>
              <span className="text-gray-500">Salary</span>
              <p className="font-medium">
                {job.currency} {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <span className="text-gray-500">Posted</span>
            <p className="font-medium">{new Date(job.postedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Required Skills</h3>
            <div className="flex gap-2 flex-wrap">
              {job.skills.map((skill) => (
                <span key={skill} className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="font-semibold mb-2">Description</h3>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: job.description }} />
        </div>

        {job.requirements && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Requirements</h3>
            <p className="whitespace-pre-wrap">{job.requirements}</p>
          </div>
        )}

        {user?.collection === 'candidates' && !coverLetter && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold mb-2">Cover Letter (optional)</h3>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Tell us why you're a great fit..."
            />
          </div>
        )}
      </div>
    </div>
  );
}