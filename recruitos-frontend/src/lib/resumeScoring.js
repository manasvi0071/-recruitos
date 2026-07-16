import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(' ') + '\n';
  }
  return text;
}

export async function scoreResume(resumeText, jobSkills, jobTitle) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_GROQ_API_KEY in .env');

  const prompt = `You are a resume screening assistant for a job titled "${jobTitle}".
Required skills for this job: ${(jobSkills || []).join(', ') || 'not specified'}.

Resume text:
---
${resumeText.slice(0, 6000)}
---

Respond with ONLY valid JSON, no markdown, no code fences, no explanation, in exactly this shape:
{"score": <integer 0-100>, "matched_skills": [<strings>], "missing_skills": [<strings>]}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const raw = data.choices[0].message.content;
  const clean = raw.replace(/```json|```/g, '').trim();
  const result = JSON.parse(clean);

  return {
    score: Math.max(0, Math.min(100, Math.round(result.score))),
    matched_skills: result.matched_skills || [],
    missing_skills: result.missing_skills || [],
  };
}