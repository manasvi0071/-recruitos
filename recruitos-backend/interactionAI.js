export async function draftInteractionNote({ entityName, entityType, interactionType }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_GROQ_API_KEY in .env');

  const prompt = `You are a recruitment coordinator writing a short internal CRM log note.
Entity: ${entityName} (${entityType})
Interaction type: ${interactionType}

Write ONE short, professional note (2-3 sentences max) describing this interaction, as if it just happened.
Keep it generic but realistic for a campus recruitment context (e.g. sharing job openings, requesting student lists, confirming interview slots, sending offer letters).
Respond with ONLY the note text — no quotes, no markdown, no preamble.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}