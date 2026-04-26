// on_application_create.js — triggered when a candidate applies to a job
routerUse(new Middleware((e) => {
  onRecordCreate('applications', async (e) => {
    try {
      const applicationId = e.record.id;
      const jobId = e.record.get('job');
      const candidateId = e.record.get('candidate');

      // 1. Fetch candidate's cvEmbedding and job's jdEmbedding
      const candidateCollection = $app.dao().findCollectionByName('candidates');
      const jobCollection = $app.dao().findCollectionByName('jobs');

      const candidate = $app.dao().findRecordById(candidateCollection, candidateId);
      const job = $app.dao().findRecordById(jobCollection, jobId);

      const cvEmbedding = candidate ? JSON.parse(candidate.get('cvEmbedding') || '[]') : [];
      const jdEmbedding = job ? JSON.parse(job.get('jdEmbedding') || '[]') : [];

      let matchScore = 0;
      let aiBreakdown = { skills: 0, experience: 0, culture: 0 };

      // 2. Compute cosine similarity
      if (cvEmbedding.length > 0 && jdEmbedding.length > 0) {
        const dotProduct = cvEmbedding.reduce((sum, v, i) => sum + v * jdEmbedding[i], 0);
        const cvMag = Math.sqrt(cvEmbedding.reduce((sum, v) => sum + v * v, 0));
        const jdMag = Math.sqrt(jdEmbedding.reduce((sum, v) => sum + v * v, 0));
        const cosine = cvMag > 0 && jdMag > 0 ? dotProduct / (cvMag * jdMag) : 0;
        matchScore = Math.round(cosine * 100);
      }

      // 3. Call GPT-4o for detailed breakdown (if API key available)
      const openAiKey = $app.settings().meta.openaiApiKey || '';
      const cvParsed = candidate ? JSON.parse(candidate.get('cvParsedJson') || '{}') : {};
      const cvText = cvParsed.text || '';
      const jobDesc = job ? (job.get('description') || '') : '';
      const jobReqs = job ? (job.get('requirements') || '') : '';

      if (openAiKey && cvText.length > 50 && jobDesc.length > 50) {
        const breakdownPrompt = `You are an AI recruiter. Score this candidate's fit for the job.
Job Description: ${jobDesc.substring(0, 1000)}
Job Requirements: ${jobReqs.substring(0, 500)}
Candidate CV: ${cvText.substring(0, 1500)}

Return ONLY valid JSON with keys: skills (0-100), experience (0-100), culture (0-100). No explanation.`;

        const gptRes = $http.send({
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST',
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: breakdownPrompt }],
            temperature: 0.3,
            max_tokens: 500
          }),
          headers: {
            'Authorization': `Bearer ${openAiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (gptRes.statusCode === 200) {
          const gptData = JSON.parse(gptRes.raw);
          const content = gptData.choices[0].message.content;
          try {
            aiBreakdown = JSON.parse(content);
          } catch (parseErr) {
            aiBreakdown = { skills: matchScore * 0.8, experience: matchScore * 0.9, culture: matchScore };
          }
        }
      }

      // 4. PATCH application with scores
      e.record.set('matchScore', matchScore);
      e.record.set('aiScoreBreakdown', JSON.stringify(aiBreakdown));
      e.record.set('stage', 'applied');
      $app.dao().saveRecord(e.record);

      // 5. Update job applicantCount +1
      if (job) {
        const count = job.get('applicantCount') || 0;
        job.set('applicantCount', count + 1);
        $app.dao().saveRecord(job);
      }

      // 6. Update candidate totalApplications
      if (candidate) {
        const apps = candidate.get('totalApplications') || 0;
        candidate.set('totalApplications', apps + 1);
        $app.dao().saveRecord(candidate);
      }

      console.log('Application scored: ' + matchScore + '% for candidate: ' + candidate?.get('fullName'));
    } catch (err) {
      console.error('Application create hook error:', err);
    }
  });
}));