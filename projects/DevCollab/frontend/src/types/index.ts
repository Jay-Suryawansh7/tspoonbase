export interface Candidate {
  id: string;
  fullName: string;
  headline?: string;
  location?: string;
  phone?: string;
  linkedinUrl?: string;
  cvFile?: string;
  cvParsedJson?: { text: string; pages: number };
  cvEmbedding?: number[];
  totalApplications: number;
  status: 'active' | 'inactive' | 'banned';
  email: string;
  created: string;
  updated: string;
}

export interface Recruiter {
  id: string;
  companyName: string;
  companyLogo?: string;
  plan: 'free' | 'pro' | 'enterprise';
  jobPostsUsed: number;
  email: string;
  created: string;
  updated: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: 'USD' | 'EUR' | 'INR' | 'GBP';
  locationType: 'remote' | 'hybrid' | 'onsite';
  location?: string;
  skills?: string[];
  jdEmbedding?: number[];
  status: 'draft' | 'active' | 'paused' | 'closed';
  applicantCount: number;
  deadline?: string;
  postedBy: string;
  postedAt: string;
  updated: string;
}

export interface Application {
  id: string;
  job: string;
  candidate: string;
  coverLetter?: string;
  matchScore?: number;
  aiScoreBreakdown?: { skills: number; experience: number; culture: number };
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired';
  recruiterNotes?: string;
  candidateWithdrawn: boolean;
  appliedAt: string;
  stageUpdatedAt: string;
}

export interface PipelineStage {
  id: string;
  job: string;
  name: string;
  order: number;
  color: string;
  isDefault: boolean;
}

export interface Interview {
  id: string;
  application: string;
  scheduledAt: string;
  durationMinutes: number;
  type: 'phone' | 'video' | 'onsite';
  meetingLink?: string;
  notes?: string;
  outcome: 'pending' | 'pass' | 'fail';
}

export interface SavedJob {
  id: string;
  candidate: string;
  job: string;
  savedAt: string;
}

export interface User {
  id: string;
  email: string;
  collection: 'candidates' | 'recruiters';
}