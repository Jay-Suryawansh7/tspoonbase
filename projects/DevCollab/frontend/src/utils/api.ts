import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { Candidate, Recruiter, Job, Application, User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8090';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    );
  }

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Auth
  async loginCandidate(email: string, password: string) {
    const res = await this.client.post('/api/collections/candidates/auth-with-password', { email, password });
    if (res.data.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async loginRecruiter(email: string, password: string) {
    const res = await this.client.post('/api/collections/recruiters/auth-with-password', { email, password });
    if (res.data.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async requestOtp(email: string) {
    return this.client.post('/api/collections/candidates/request-otp', { email });
  }

  async verifyOtp(otpId: string, otp: string) {
    const res = await this.client.post('/api/collections/candidates/auth-with-otp', { otpId, otp });
    if (res.data.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async refreshAuth() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await this.client.post('/api/collections/_auth/refresh', {});
      if (res.data.token) {
        this.setToken(res.data.token);
      }
      return res.data;
    } catch {
      this.clearToken();
      return null;
    }
  }

  async currentUser(): Promise<User | null> {
    try {
      const res = await this.client.get('/api/collections/_auth/record');
      return res.data;
    } catch {
      return null;
    }
  }

  async logout() {
    try {
      await this.client.post('/api/collections/_auth/auth-signout', {});
    } finally {
      this.clearToken();
    }
  }

  // Candidates
  async registerCandidate(data: { email: string; password: string; fullName: string }) {
    return this.client.post('/api/collections/candidates/records', data);
  }

  async getCandidateProfile() {
    const res = await this.client.get('/api/collections/candidates/record');
    return res.data as Candidate;
  }

  async updateCandidate(data: Partial<Candidate>) {
    return this.client.patch('/api/collections/candidates/record', data);
  }

  async uploadCV(file: File) {
    const formData = new FormData();
    formData.append('cvFile', file);
    const res = await this.client.post('/api/collections/candidates/record', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // Recruiters
  async registerRecruiter(data: { email: string; password: string; companyName: string }) {
    return this.client.post('/api/collections/recruiters/records', data);
  }

  async getRecruiterProfile() {
    const res = await this.client.get('/api/collections/recruiters/record');
    return res.data as Recruiter;
  }

  async updateRecruiter(data: Partial<Recruiter>) {
    return this.client.patch('/api/collections/recruiters/record', data);
  }

  // Jobs
  async getJobs(filter?: string, page = 1, perPage = 20) {
    const res = await this.client.get('/api/collections/jobs/records', {
      params: { page, perPage, filter, sort: '-created' },
    });
    return res.data as { items: Job[]; totalItems: number; totalPages: number };
  }

  async getJob(id: string) {
    const res = await this.client.get(`/api/collections/jobs/records/${id}`);
    return res.data as Job;
  }

  async createJob(data: Partial<Job>) {
    return this.client.post('/api/collections/jobs/records', data);
  }

  async updateJob(id: string, data: Partial<Job>) {
    return this.client.patch(`/api/collections/jobs/records/${id}`, data);
  }

  async deleteJob(id: string) {
    return this.client.delete(`/api/collections/jobs/records/${id}`);
  }

  async getMyJobs() {
    return this.getJobs('', 1, 100);
  }

  // Applications
  async getApplications(filter?: string) {
    const res = await this.client.get('/api/collections/applications/records', { params: { filter, sort: '-created' } });
    return res.data as { items: Application[] };
  }

  async getJobApplications(jobId: string) {
    return this.getApplications(`job = "${jobId}"`);
  }

  async applyToJob(jobId: string, coverLetter?: string) {
    return this.client.post('/api/collections/applications/records', {
      job: jobId,
      coverLetter,
    });
  }

  async updateApplicationStage(appId: string, stage: string, notes?: string) {
    return this.client.patch(`/api/collections/applications/records/${appId}`, {
      stage,
      recruiterNotes: notes,
    });
  }

  // File tokens for CV viewing
  async getFileToken(recordId: string, filename: string) {
    const res = await this.client.post('/api/files/token', {
      collection: 'candidates',
      recordId,
      filename,
    });
    return res.data as { token: string };
  }

  getFileUrl(collection: string, recordId: string, filename: string, token?: string) {
    const base = `${API_BASE}/api/files/${collection}/${recordId}/${filename}`;
    return token ? `${base}?token=${token}` : base;
  }

  // Batch API
  async batchImport(requests: { method: string; url: string; body: unknown }[]) {
    return this.client.post('/api/batch', { requests });
  }

  // Vector search
  async vectorSearch(collection: string, field: string, vector: number[], limit = 20, minSimilarity = 0.7) {
    const res = await this.client.post(`/api/collections/${collection}/vector-search`, {
      field,
      vector,
      limit,
      minSimilarity,
    });
    return res.data;
  }

  // SSE for realtime updates
  subscribeToSSE(callback: (data: { type: string; data: unknown }) => void) {
    const token = this.getToken();
    const eventSource = new EventSource(`${API_BASE}/api/realtime?token=${token}`);
    eventSource.onmessage = (e) => {
      try {
        callback(JSON.parse(e.data));
      } catch {
        callback({ type: 'unknown', data: e.data });
      }
    };
    return eventSource;
  }

  // View collections
  async getCandidateRankings(jobId: string) {
    const res = await this.client.get('/api/collections/candidate_rankings/records', {
      params: { filter: `job = "${jobId}"`, sort: '-matchScore' },
    });
    return res.data;
  }

  async getPipelineFunnel(jobId: string) {
    const res = await this.client.get('/api/collections/pipeline_funnel/records', {
      params: { filter: `job = "${jobId}"` },
    });
    return res.data;
  }
}

export const api = new ApiClient();