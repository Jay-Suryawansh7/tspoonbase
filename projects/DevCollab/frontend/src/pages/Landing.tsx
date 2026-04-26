import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function Landing() {
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (location) params.set('location', location);
    window.location.href = `/jobs?${params.toString()}`;
  };

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Find Talent with AI
          </h1>
          <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
            NeuralHire uses advanced AI to match the best candidates with the right roles.
            Post jobs, receive applications, and let AI handle the screening.
          </p>
          <div className="flex gap-4 max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search jobs (e.g., React, Python)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-40 px-4 py-3 rounded-lg text-gray-900"
            />
            <button
              onClick={handleSearch}
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Matching</h3>
              <p className="text-gray-600">
                Our AI analyzes CVs and job descriptions to find the perfect match automatically.
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-xl font-semibold mb-2">Easy CV Parsing</h3>
              <p className="text-gray-600">
                Upload your PDF CV and our AI extracts all relevant information instantly.
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Smart Analytics</h3>
              <p className="text-gray-600">
                Track applicants through the pipeline with beautiful analytics dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to get started?</h2>
          <div className="flex gap-4 justify-center">
            <Link
              to="/jobs"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
            >
              Browse Jobs
            </Link>
            <Link
              to="/recruiter/register"
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
            >
              Post a Job
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}