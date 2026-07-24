const express = require('express');
const Groq = require('groq-sdk');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const MODEL = 'llama-3.3-70b-versatile';

router.post('/generate', async (req, res) => {
  try {
    const { job_id, difficulty, question_count } = req.body;
    const count = Math.min(Math.max(Number(question_count) || 20, 5), 50);

    let jobContext = 'General aptitude test for a fresher-level role.';
    let resolvedDifficulty = difficulty === 'auto' || !difficulty ? 'medium' : difficulty;

    if (job_id) {
      const { data: job, error: jobErr } = await supabase
        .from('job_profiles')
        .select('*')
        .eq('id', job_id)
        .single();
      if (jobErr) throw jobErr;

      jobContext = `Job Title: ${job.title}
Experience Level: ${job.experience || 'Not specified'}
Qualification: ${job.qualification || 'Not specified'}
Key Skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || 'Not specified'}`;

      if (difficulty === 'auto' || !difficulty) {
        const exp = (job.experience || '').toLowerCase();
        if (exp.includes('senior') || exp.includes('5') || exp.includes('lead')) {
          resolvedDifficulty = 'hard';
        } else if (exp.includes('fresher') || exp.includes('0') || exp.includes('intern')) {
          resolvedDifficulty = 'easy';
        } else {
          resolvedDifficulty = 'medium';
        }
      }
    }

    const prompt = `Generate ${count} aptitude test questions for a candidate applying to this role:

${jobContext}

Difficulty level: ${resolvedDifficulty}

Mix these topic areas roughly evenly: quantitative/numerical reasoning, logical reasoning, verbal ability, and basic role-relevant technical/domain knowledge (based on the key skills above, if any).

Respond with ONLY valid JSON, no markdown, no code fences, no explanation, in exactly this shape:
{"questions": [{"q": "<question text>", "options": ["<A>", "<B>", "<C>", "<D>"], "answer": "<the correct option text, must exactly match one of the options>", "topic": "<Quantitative|Logical|Verbal|Technical>", "difficulty": "${resolvedDifficulty}"}]}`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 4000,
    });

    let raw = completion.choices[0].message.content.trim();
    raw = raw.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('AI returned invalid JSON. Please try again.');
    }

    res.json({
      questions: parsed.questions || [],
      total: (parsed.questions || []).length,
      difficulty: resolvedDifficulty,
    });
  } catch (err) {
    console.error('Aptitude generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;