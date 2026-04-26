// on_job_create.js — triggered when a recruiter creates a job
routerUse(new Middleware((e) => {
  onRecordCreate('jobs', async (e) => {
    try {
      const jobId = e.record.id;
      const recruiterId = e.record.get('postedBy');
      const description = e.record.get('description') || '';
      const requirements = e.record.get('requirements') || '';
      const combinedText = `${description}\n${requirements}`.substring(0, 8000);

      // 1. Embed job description + requirements via OpenAI
      const openAiKey = $app.settings().meta.openaiApiKey || '';
      if (openAiKey && combinedText.length > 0) {
        const embedRes = $http.send({
          url: 'https://api.openai.com/v1/embeddings',
          method: 'POST',
          body: JSON.stringify({ input: combinedText, model: 'text-embedding-3-small' }),
          headers: {
            'Authorization': `Bearer ${openAiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (embedRes.statusCode === 200) {
          const embedData = JSON.parse(embedRes.raw);
          const vector = embedData.data[0].embedding;
          e.record.set('jdEmbedding', JSON.stringify(vector));
          $app.dao().saveRecord(e.record);
        }
      }

      // 2. Create default pipeline stages via batch API (simulated here by direct insert)
      const pipelineCollection = $app.dao().findCollectionByName('pipeline_stages');
      const defaults = [
        { name: 'Applied', order: 0, color: '#3b82f6', isDefault: true },
        { name: 'Screening', order: 1, color: '#f59e0b', isDefault: true },
        { name: 'Interview', order: 2, color: '#8b5cf6', isDefault: true },
        { name: 'Offer', order: 3, color: '#10b981', isDefault: true },
      ];

      for (const def of defaults) {
        const stage = new Record(pipelineCollection, {
          job: jobId,
          name: def.name,
          order: def.order,
          color: def.color,
          isDefault: def.isDefault,
        });
        $app.dao().saveRecord(stage);
      }

      // 3. Award recruiter +1 jobPostsUsed count
      const recruiterCollection = $app.dao().findCollectionByName('recruiters');
      const recruiter = $app.dao().findRecordById(recruiterCollection, recruiterId);
      if (recruiter) {
        const current = recruiter.get('jobPostsUsed') || 0;
        recruiter.set('jobPostsUsed', current + 1);
        $app.dao().saveRecord(recruiter);
      }
    } catch (err) {
      console.error('Job create hook error:', err);
    }
  });
}));
