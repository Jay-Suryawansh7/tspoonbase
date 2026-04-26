// on_stage_update.js — triggered when application stage changes
routerUse(new Middleware((e) => {
  onRecordUpdate('applications', async (e) => {
    if (!e.dirtyFields.includes('stage')) return;

    try {
      const stage = e.record.get('stage');
      const candidateId = e.record.get('candidate');
      const jobId = e.record.get('job');
      const coverLetter = e.record.get('coverLetter') || '';

      // Fetch candidate and job for email
      const candidateCollection = $app.dao().findCollectionByName('candidates');
      const jobCollection = $app.dao().findCollectionByName('jobs');

      const candidate = $app.dao().findRecordById(candidateCollection, candidateId);
      const job = $app.dao().findRecordById(jobCollection, jobId);

      const candidateEmail = candidate?.get('email');
      const jobTitle = job?.get('title');

      if (!candidateEmail || !jobTitle) return;

      // Stage-based email logic (would use $app.mailer in production)
      if (stage === 'offer') {
        const subject = `Congratulations! You've received an offer for ${jobTitle}`;
        const body = `Dear ${candidate.get('fullName')},

Congratulations! We're pleased to offer you the position of ${jobTitle} at ${job.get('companyName') || 'our company'}.

Please log in to your dashboard to view the details and respond to the offer.

Best regards,
The NeuralHire Team`;
        console.log(`[EMAIL] To: ${candidateEmail}, Subject: ${subject}`);
        console.log(`[EMAIL] Body: ${body}`);
      }

      if (stage === 'rejected') {
        const recruiterNotes = e.record.get('recruiterNotes') || 'We regret to inform you that we have decided to move forward with other candidates.';
        const subject = `Update on your application for ${jobTitle}`;
        const body = `Dear ${candidate.get('fullName')},

Thank you for your interest in the ${jobTitle} position and for taking the time to apply.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.

${recruiterNotes}

We wish you the best in your job search.

Best regards,
The NeuralHire Team`;
        console.log(`[EMAIL] To: ${candidateEmail}, Subject: ${subject}`);
        console.log(`[EMAIL] Body: ${body}`);
      }

      console.log(`Stage updated to: ${stage} for candidate: ${candidate?.get('fullName')}`);
    } catch (err) {
      console.error('Stage update hook error:', err);
    }
  });
}));