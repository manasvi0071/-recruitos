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
  if (!text.trim()) {
    throw new Error('No extractable text found in PDF (it may be a scanned/image-only file).');
  }
  return text;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scoreResume(resumeText, jobSkills, jobTitle, retries = 2) {
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

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
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

      if (response.status === 429) {
        // Rate limited — back off and retry instead of failing immediately.
        const waitMs = 1500 * (attempt + 1);
        lastErr = new Error(`Groq API rate limited (429), retrying in ${waitMs}ms`);
        await sleep(waitMs);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const raw = data.choices[0].message.content;
      const clean = raw.replace(/```json|```/g, '').trim();

      let result;
      try {
        result = JSON.parse(clean);
      } catch {
        throw new Error(`Groq returned non-JSON response: ${raw.slice(0, 200)}`);
      }

      return {
        score: Math.max(0, Math.min(100, Math.round(result.score))),
        matched_skills: result.matched_skills || [],
        missing_skills: result.missing_skills || [],
      };
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(1000 * (attempt + 1));
    }
  }
  throw lastErr;
}