import { Database, Collection, SchemaField, Record } from '../dist/index.js';

export default async function migrate(db: Database) {
  // Create candidates collection
  const candidates = new Collection('candidates', 'auth');
  candidates.addField(new SchemaField('fullName', 'text', { required: true }));
  candidates.addField(new SchemaField('headline', 'text'));
  candidates.addField(new SchemaField('location', 'text'));
  candidates.addField(new SchemaField('phone', 'text'));
  candidates.addField(new SchemaField('linkedinUrl', 'url'));
  candidates.addField(new SchemaField('cvFile', 'file', { maxSelect: 1, maxSize: 5242880, mimeTypes: ['application/pdf'] }));
  candidates.addField(new SchemaField('cvParsedJson', 'json'));
  candidates.addField(new SchemaField('cvEmbedding', 'text'));
  candidates.addField(new SchemaField('totalApplications', 'number', { default: 0 }));
  candidates.addField(new SchemaField('status', 'select', { values: ['active', 'inactive', 'banned'], default: 'active' }));
  candidates.listRule = '@request.auth.id = id || @request.auth.collection = "recruiters"';
  candidates.viewRule = '@request.auth.id = id || @request.auth.collection = "recruiters"';
  candidates.updateRule = '@request.auth.id = id';
  candidates.deleteRule = '@request.auth.id = id';
  db.saveCollection(candidates);

  // Create recruiters collection
  const recruiters = new Collection('recruiters', 'auth');
  recruiters.addField(new SchemaField('companyName', 'text', { required: true }));
  recruiters.addField(new SchemaField('companyLogo', 'file'));
  recruiters.addField(new SchemaField('plan', 'select', { values: ['free', 'pro', 'enterprise'], default: 'free' }));
  recruiters.addField(new SchemaField('jobPostsUsed', 'number', { default: 0 }));
  db.saveCollection(recruiters);

  // Create jobs collection
  const jobs = new Collection('jobs', 'base');
  jobs.addField(new SchemaField('title', 'text', { required: true }));
  jobs.addField(new SchemaField('company', 'relation', { collectionId: 'recruiters', cascadeDelete: false }));
  jobs.addField(new SchemaField('description', 'editor', { required: true }));
  jobs.addField(new SchemaField('requirements', 'text'));
  jobs.addField(new SchemaField('salaryMin', 'number'));
  jobs.addField(new SchemaField('salaryMax', 'number'));
  jobs.addField(new SchemaField('currency', 'select', { values: ['USD', 'EUR', 'INR', 'GBP'], default: 'USD' }));
  jobs.addField(new SchemaField('locationType', 'select', { values: ['remote', 'hybrid', 'onsite'], default: 'remote' }));
  jobs.addField(new SchemaField('location', 'text'));
  jobs.addField(new SchemaField('skills', 'select', { values: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'GraphQL', 'REST', 'gRPC'], maxSelect: 10 }));
  jobs.addField(new SchemaField('jdEmbedding', 'text'));
  jobs.addField(new SchemaField('status', 'select', { values: ['draft', 'active', 'paused', 'closed'], default: 'draft' }));
  jobs.addField(new SchemaField('applicantCount', 'number', { default: 0 }));
  jobs.addField(new SchemaField('deadline', 'date'));
  jobs.addField(new SchemaField('postedBy', 'relation', { collectionId: 'recruiters', cascadeDelete: false }));
  jobs.listRule = 'status = "active" || @request.auth.id = postedBy';
  jobs.createRule = '@request.auth.collection = "recruiters"';
  jobs.updateRule = '@request.auth.id = postedBy';
  jobs.deleteRule = '@request.auth.id = postedBy';
  db.saveCollection(jobs);

  // Create applications collection  
  const applications = new Collection('applications', 'base');
  applications.addField(new SchemaField('job', 'relation', { collectionId: 'jobs', cascadeDelete: true }));
  applications.addField(new SchemaField('candidate', 'relation', { collectionId: 'candidates', cascadeDelete: true }));
  applications.addField(new SchemaField('coverLetter', 'text'));
  applications.addField(new SchemaField('matchScore', 'number'));
  applications.addField(new SchemaField('aiScoreBreakdown', 'json'));
  applications.addField(new SchemaField('stage', 'select', { values: ['applied', 'screening', 'interview', 'offer', 'rejected', 'hired'], default: 'applied' }));
  applications.addField(new SchemaField('recruiterNotes', 'text'));
  applications.addField(new SchemaField('candidateWithdrawn', 'bool', { default: false }));
  applications.listRule = '@request.auth.id = job.postedBy || @request.auth.id = candidate';
  applications.viewRule = '@request.auth.id = job.postedBy || @request.auth.id = candidate';
  applications.createRule = '@request.auth.collection = "candidates"';
  applications.updateRule = '@request.auth.id = job.postedBy';
  db.saveCollection(applications);

  // Create pipeline_stages collection
  const pipeline_stages = new Collection('pipeline_stages', 'base');
  pipeline_stages.addField(new SchemaField('job', 'relation', { collectionId: 'jobs', cascadeDelete: true }));
  pipeline_stages.addField(new SchemaField('name', 'text', { required: true }));
  pipeline_stages.addField(new SchemaField('order', 'number', { required: true }));
  pipeline_stages.addField(new SchemaField('color', 'text'));
  pipeline_stages.addField(new SchemaField('isDefault', 'bool', { default: false }));
  pipeline_stages.listRule = '@request.auth.id = job.postedBy';
  pipeline_stages.createRule = '@request.auth.collection = "recruiters"';
  pipeline_stages.updateRule = '@request.auth.id = job.postedBy';
  db.saveCollection(pipeline_stages);

  // Create interviews collection
  const interviews = new Collection('interviews', 'base');
  interviews.addField(new SchemaField('application', 'relation', { collectionId: 'applications', cascadeDelete: true }));
  interviews.addField(new SchemaField('scheduledAt', 'date', { required: true }));
  interviews.addField(new SchemaField('durationMinutes', 'number', { default: 30 }));
  interviews.addField(new SchemaField('type', 'select', { values: ['phone', 'video', 'onsite'], default: 'video' }));
  interviews.addField(new SchemaField('meetingLink', 'url'));
  interviews.addField(new SchemaField('notes', 'text'));
  interviews.addField(new SchemaField('outcome', 'select', { values: ['pending', 'pass', 'fail'], default: 'pending' }));
  db.saveCollection(interviews);

  // Create saved_jobs collection
  const saved_jobs = new Collection('saved_jobs', 'base');
  saved_jobs.addField(new SchemaField('candidate', 'relation', { collectionId: 'candidates', cascadeDelete: true }));
  saved_jobs.addField(new SchemaField('job', 'relation', { collectionId: 'jobs', cascadeDelete: true }));
  saved_jobs.listRule = '@request.auth.id = candidate';
  saved_jobs.viewRule = '@request.auth.id = candidate';
  saved_jobs.createRule = '@request.auth.id = candidate';
  saved_jobs.updateRule = '@request.auth.id = candidate';
  saved_jobs.deleteRule = '@request.auth.id = candidate';
  db.saveCollection(saved_jobs);
}