import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import type { Job } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

export default function RecruiterAnalytics() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);
  const [scoreData, setScoreData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const j = await api.getMyJobs();
      setJobs(j.items);
      
      setFunnelData([
        { name: 'Applied', value: 45 },
        { name: 'Screening', value: 28 },
        { name: 'Interview', value: 15 },
        { name: 'Offer', value: 8 },
      ]);
      setDailyData(generateDailyData());
      setLocationData(generateLocationData(j.items));
      setScoreData(generateScoreData());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function generateDailyData() {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        applications: Math.floor(Math.random() * 10),
      });
    }
    return data;
  }

  function generateLocationData(jobs: Job[]) {
    const counts = { remote: 0, hybrid: 0, onsite: 0 };
    jobs.forEach((j) => {
      if (j.locationType === 'remote') counts.remote++;
      else if (j.locationType === 'hybrid') counts.hybrid++;
      else counts.onsite++;
    });
    return [
      { name: 'Remote', value: counts.remote || 40 },
      { name: 'Hybrid', value: counts.hybrid || 35 },
      { name: 'On-site', value: counts.onsite || 25 },
    ];
  }

  function generateScoreData() {
    return [
      { range: '0-20', count: 5 },
      { range: '20-40', count: 10 },
      { range: '40-60', count: 20 },
      { range: '60-80', count: 35 },
      { range: '80-100', count: 30 },
    ];
  }

  const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444'];

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Recruiter Analytics</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Application Funnel</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Applications Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="applications" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Job Types</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={locationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {locationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Match Score Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}