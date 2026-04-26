import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import type { Candidate } from '../types';

export default function CandidateProfile() {
  const [profile, setProfile] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getCandidateProfile().then((p) => {
      setProfile(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      await api.updateCandidate({
        fullName: profile.fullName,
        headline: profile.headline,
        location: profile.location,
        phone: profile.phone,
        linkedinUrl: profile.linkedinUrl,
      });
      alert('Profile saved!');
    } catch (e) {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadCV() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.');
      return;
    }
    if (file.type !== 'application/pdf') {
      alert('Only PDF files allowed');
      return;
    }
    setUploading(true);
    try {
      await api.uploadCV(file);
      const updated = await api.getCandidateProfile();
      setProfile(updated);
      alert('CV uploaded! AI is processing your CV...');
    } catch (e) {
      alert('Failed to upload CV');
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={profile?.fullName || ''}
              onChange={(e) => setProfile({ ...profile!, fullName: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Headline</label>
            <input
              type="text"
              value={profile?.headline || ''}
              onChange={(e) => setProfile({ ...profile!, headline: e.target.value })}
              placeholder="e.g., Senior Software Engineer"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={profile?.location || ''}
              onChange={(e) => setProfile({ ...profile!, location: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={profile?.phone || ''}
              onChange={(e) => setProfile({ ...profile!, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={profile?.linkedinUrl || ''}
              onChange={(e) => setProfile({ ...profile!, linkedinUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary-600 text-white py-2 rounded-md font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Upload CV (PDF)</h2>
        <p className="text-gray-600 mb-4">
          Upload your resume in PDF format. Our AI will parse it and create an embedding for smart job matching.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          onChange={handleUploadCV}
          className="block w-full text-sm"
        />
        {profile?.cvEmbedding && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
            ✓ CV uploaded and processed
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Application Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{profile?.totalApplications || 0}</div>
            <div className="text-gray-600">Total Applications</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">{profile?.status || 'active'}</div>
            <div className="text-gray-600">Status</div>
          </div>
        </div>
      </div>
    </div>
  );
}