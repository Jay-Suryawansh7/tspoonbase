// on_cv_upload.js — triggered when a candidate uploads/updates their CV
routerUse(new Middleware((e) => {
  onRecordUpdate('candidates', async (e) => {
    if (!e.record.get('cvFile') || !e.dirtyFields.includes('cvFile')) return;

    try {
      const candidateId = e.record.id;
      const fullName = e.record.get('fullName');
      const cvFilename = e.record.get('cvFile');

      // 1. Generate protected file token
      const token = $filesystem.newFileToken('candidates', candidateId, cvFilename, { ttl: 900 });

      // 2. Fetch CV binary via token URL
      const tokenUrl = `${$app.settings().meta.appUrl}/api/files/candidates/${candidateId}/${cvFilename}?token=${token}`;
      const res = $http.send({ url: tokenUrl, method: 'GET' });
      if (res.statusCode !== 200) {
        console.error('Failed to fetch CV binary:', res.statusCode);
        return;
      }

      // 3. Parse PDF text using pdf-parse
      const pdfParse = require('pdf-parse');
      const parsed = await pdfParse(res.raw);
      const cvText = parsed.text.substring(0, 8000); // limit for OpenAI

      // 4. Store parsed text in cvParsedJson
      e.record.set('cvParsedJson', JSON.stringify({ text: cvText, pages: parsed.numpages }));

      // 5. POST to OpenAI embeddings API
      const openAiKey = $app.settings().meta.openaiApiKey || '';
      if (!openAiKey) {
        console.error('OpenAI API key not configured');
        return;
      }

      const embedRes = $http.send({
        url: 'https://api.openai.com/v1/embeddings',
        method: 'POST',
        body: JSON.stringify({ input: cvText, model: 'text-embedding-3-small' }),
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (embedRes.statusCode !== 200) {
        console.error('Embedding failed:', embedRes.statusCode, embedRes.raw);
        return;
      }

      const embedData = JSON.parse(embedRes.raw);
      const vector = embedData.data[0].embedding;

      // 6. PATCH candidate record with embedding
      e.record.set('cvEmbedding', JSON.stringify(vector));
      $app.dao().saveRecord(e.record);

      console.log('CV embedded for candidate: ' + fullName);
    } catch (err) {
      console.error('CV upload hook error:', err);
    }
  });
}));
