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

export async function scoreResume(resumeText, jobSkills, jobTitle) {
 const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // same as AIInterview.jsx — update together if you deploy

  const response = await fetch(`${BACKEND_URL}/api/ai-interview/score-resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, jobSkills, jobTitle }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resume scoring failed: ${response.status} ${errText}`);
  }

  return response.json();
}