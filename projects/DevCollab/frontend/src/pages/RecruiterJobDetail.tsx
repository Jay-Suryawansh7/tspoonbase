import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import type { Job, Application, Candidate } from '../types';

interface AppWithCandidate extends Application {
  candidateData?: Candidate;
}

export default function RecruiterJobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<AppWithCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<AppWithCandidate | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  async function loadData() {
    if (!id) return;
    try {
      const [j, apps] = await Promise.all([
        api.getJob(id),
        api.getJobApplications(id),
      ]);
      setJob(j);
      // Sort by match score descending
      const sorted = apps.items.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setApplications(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function changeStage(appId: string, stage: string) {
    try {
      await api.updateApplicationStage(appId, stage);
      loadData();
    } catch (e) {
      alert('Failed to update stage');
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

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/recruiter/dashboard" className="text-primary-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{job?.title}</h1>
            <p className="text-gray-600">{job?.company}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{applications.length}</p>
            <p className="text-gray-500">Applicants</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-2 mb-6">
        {stages.map((stage) => {
          const count = applications.filter((a) => a.stage === stage).length;
          return (
            <div
              key={stage}
              className="bg-white p-4 rounded-lg shadow-sm border text-center cursor-pointer hover:shadow-md"
              onClick={() => {
                const filtered = applications.filter((a) => a.stage === stage);
                if (filtered.length > 0) setSelectedApp(filtered[0]);
              }}
            >
              <div className={`text-2xl font-bold ${stageColors[stage]}`}>{count}</div>
              <div className="text-sm text-gray-500 capitalize">{stage}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Applicants (sorted by AI match score)</h2>
        </div>
        <div className="divide-y">
          {applications.map((app) => (
            <div
              key={app.id}
              className="p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedApp(app)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Candidate #{app.candidate.slice(-8)}</p>
                  <p className="text-sm text-gray-500">
                    Applied {new Date(app.appliedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  {app.matchScore !== undefined && (
                    <div className="mb-2">
                      <span className={`text-xl font-bold ${
                        app.matchScore >= 80 ? 'text-green-600' :
                        app.matchScore >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {app.matchScore}%
                      </span>
                      <span className="text-sm text-gray-500"> match</span>
                    </div>
                  )}
                  <span className={`px-2 py-1 rounded text-xs ${stageColors[app.stage]}`}>
                    {app.stage}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Applicant Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Match Score</label>
                <p className="text-2xl font-bold">{selectedApp.matchScore}%</p>
              </div>
              {selectedApp.aiScoreBreakdown && (
                <div>
                  <label className="text-sm text-gray-500">AI Breakdown</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Skills</div>
                      <div>{selectedApp.aiScoreBreakdown.skills}%</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Experience</div>
                      <div>{selectedApp.aiScoreBreakdown.experience}%</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Culture</div>
                      <div>{selectedApp.aiScoreBreakdown.culture}%</div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Stage</label>
                <select
                  value={selectedApp.stage}
                  onChange={(e) => changeStage(selectedApp.id, e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {stages.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={selectedApp.recruiterNotes || ''}
                  onChange={(e) => {
                    // Would save here
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="flex-1 border py-2 rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}