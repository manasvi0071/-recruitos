const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { analyzeResume } = require('./resumeAnalyzer');
const {
  sendCollegeOutreachEmail,
  sendStudentSelectionEmail,
  sendCollegeSelectionEmail,
  sendCompanySelectionEmail,
} = require('./emailService');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ---- COLLEGES ----
app.get('/api/colleges', async (req, res) => {
  const { course, status, search } = req.query;
  let query = supabase.from('colleges').select('*');
  if (course) query = query.ilike('course', `%${course}%`);
  if (status && status !== 'All Status') query = query.eq('status', status);
  if (search) query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,tpo.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.post('/api/colleges', async (req, res) => {
  const { data, error } = await supabase.from('colleges').insert([req.body]).select();
  if (error) return res.status(500).json({ error });
  res.json(data[0]);
});

// ---- COMPANIES ----
app.get('/api/companies', async (req, res) => {
  const { data, error } = await supabase.from('companies').select('*');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.post('/api/companies', async (req, res) => {
  const { data, error } = await supabase.from('companies').insert([req.body]).select();
  if (error) return res.status(500).json({ error });
  res.json(data[0]);
});

// ---- JOB PROFILES ----
app.get('/api/jobs', async (req, res) => {
  const { data, error } = await supabase.from('job_profiles').select('*');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.get('/api/jobs/public', async (req, res) => {
  const { data, error } = await supabase
    .from('job_profiles')
    .select('id, title, company, skills');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.post('/api/jobs', async (req, res) => {
  const { data, error } = await supabase.from('job_profiles').insert([req.body]).select();
  if (error) return res.status(500).json({ error });
  res.json(data[0]);
});

// ---- TRIGGER AI ANALYSIS ----
app.post('/api/analyze', async (req, res) => {
  const { applicationId } = req.body;

  const { data: application, error } = await supabase
    .from('applications')
    .select('*, candidates(resume_url), job_profiles(skills)')
    .eq('id', applicationId)
    .single();

  if (error || !application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const resumeUrl = application.candidates?.resume_url;
  const jobSkills = application.job_profiles?.skills || [];

  if (!resumeUrl) {
    return res.status(400).json({ error: 'No resume URL found for this candidate' });
  }

  // Respond immediately, AI runs in background
  res.json({ success: true, message: 'AI analysis started' });

  analyzeResume(resumeUrl, jobSkills, applicationId);
});

// ---- GET ALL ANALYZED RESUMES (for Resume Analyzer page) ----
app.get('/api/resume/analyzed', async (req, res) => {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      candidates (name, email, phone, college, resume_url),
      job_profiles (title, company, skills)
    `)
    .order('ai_score', { ascending: false, nullsFirst: false });

  if (error) return res.status(500).json({ error });

  const flat = data.map(app => ({
    id: app.id,
    candidate_name: app.candidates?.name,
    email: app.candidates?.email,
    phone: app.candidates?.phone,
    college: app.candidates?.college,
    resume_url: app.candidates?.resume_url,
    job_title: app.job_profiles?.title,
    company: app.job_profiles?.company,
    stage: app.stage,
    ai_score: app.ai_score,
    matched_skills: app.matched_skills,
    missing_skills: app.missing_skills,
    match_label: app.match_label,
    ai_feedback: app.ai_feedback,
    ai_status: app.ai_status,
  }));

  res.json(flat);
});

// ---- MARK CANDIDATE SELECTED → fires 3 emails automatically ----
app.post('/api/candidate/select', async (req, res) => {
  const { applicationId, ctc } = req.body;

  try {
    const { data: app } = await supabase
      .from('applications')
      .select('*, candidates(name, email, phone, college), job_profiles(title, company)')
      .eq('id', applicationId)
      .single();

    const { data: college } = await supabase
      .from('colleges')
      .select('name, tpo, tpo_email')
      .ilike('name', `%${app.candidates?.college}%`)
      .single();

    const { data: company } = await supabase
      .from('companies')
      .select('name, hr_name, hr_email')
      .eq('name', app.job_profiles?.company)
      .single();

    // Update stage in DB
    await supabase
      .from('applications')
      .update({ stage: 'Selected' })
      .eq('id', applicationId);

    // Fire all 3 emails at once
    await Promise.all([
      sendStudentSelectionEmail({
        studentName: app.candidates?.name,
        studentEmail: app.candidates?.email,
        jobTitle: app.job_profiles?.title,
        company: app.job_profiles?.company,
        ctc: ctc || 'As per company policy',
      }),
      college ? sendCollegeSelectionEmail({
        tpoName: college.tpo,
        tpoEmail: college.tpo_email,
        collegeName: college.name,
        studentName: app.candidates?.name,
        jobTitle: app.job_profiles?.title,
        company: app.job_profiles?.company,
      }) : Promise.resolve(),
      company ? sendCompanySelectionEmail({
        hrName: company.hr_name,
        hrEmail: company.hr_email,
        company: company.name,
        studentName: app.candidates?.name,
        jobTitle: app.job_profiles?.title,
        studentEmail: app.candidates?.email,
        studentPhone: app.candidates?.phone,
      }) : Promise.resolve(),
    ]);

    res.json({ success: true, message: 'Candidate selected. All 3 emails sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- COLLEGE OUTREACH EMAIL ----
app.post('/api/email/college-outreach', async (req, res) => {
  try {
    await sendCollegeOutreachEmail(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- OFFERS ----
app.get('/api/offers', async (req, res) => {
  const { data, error } = await supabase
    .from('offers')
    .select('*, candidates(name), job_profiles(title, company)');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// ---- JOINING ----
app.get('/api/joining', async (req, res) => {
  const { data, error } = await supabase
    .from('joining')
    .select('*, candidates(name, college), offers(job_profiles(company))');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// ---- COMMUNICATIONS ----
app.get('/api/communications', async (req, res) => {
  const { collegeId, companyId } = req.query;
  let query = supabase.from('communications').select('*').order('date', { ascending: true });
  if (collegeId) query = query.eq('college_id', collegeId);
  if (companyId) query = query.eq('company_id', companyId);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.post('/api/communications', async (req, res) => {
  const { data, error } = await supabase.from('communications').insert([req.body]).select();
  if (error) return res.status(500).json({ error });
  res.json(data[0]);
});

app.listen(5000, () => console.log('✅ RecruitOS backend running on http://localhost:5000'));
const { scoreGDSession } = require('./gdScorer');

// Create GD Session
app.post('/api/gd/create', async (req, res) => {
  const { topic, duration_minutes, job_id, candidates } = req.body;

  const { data: session, error } = await supabase
    .from('gd_sessions')
    .insert([{ topic, duration_minutes, job_id }])
    .select()
    .single();

  if (error) return res.status(500).json({ error });

  // Add participants
  const participants = candidates.map(c => ({
    session_id: session.id,
    candidate_id: c.id,
    candidate_name: c.name,
    candidate_email: c.email,
  }));

  const { data: parts } = await supabase
    .from('gd_participants')
    .insert(participants)
    .select();

  // Send email to each student with their join link
  for (const p of parts) {
    await sendGDInviteEmail({
      studentName: p.candidate_name,
      studentEmail: p.candidate_email,
      topic: session.topic,
      duration: duration_minutes,
      joinLink: `${process.env.FRONTEND_URL}/gd/${session.id}?token=${p.join_token}`,
    });
  }

  res.json({ success: true, session });
});

// Start GD Session
app.post('/api/gd/:id/start', async (req, res) => {
  const { data, error } = await supabase
    .from('gd_sessions')
    .update({ status: 'Active', started_at: new Date() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error });
  res.json({ success: true, session: data });
});

// End GD + trigger AI scoring
app.post('/api/gd/:id/end', async (req, res) => {
  await supabase
    .from('gd_sessions')
    .update({ status: 'Ended', ended_at: new Date() })
    .eq('id', req.params.id);

  res.json({ success: true, message: 'GD ended. AI scoring started.' });

  // AI scores in background
  scoreGDSession(req.params.id);
});

// Get session details + participants + messages
app.get('/api/gd/:id', async (req, res) => {
  const { data: session } = await supabase
    .from('gd_sessions')
    .select('*')
    .eq('id', req.params.id)
    .single();

  const { data: participants } = await supabase
    .from('gd_participants')
    .select('*')
    .eq('session_id', req.params.id)
    .order('ai_score', { ascending: false });

  const { data: messages } = await supabase
    .from('gd_messages')
    .select('*')
    .eq('session_id', req.params.id)
    .order('sent_at', { ascending: true });

  res.json({ session, participants, messages });
});

// Validate student token
app.get('/api/gd/:id/join', async (req, res) => {
  const { token } = req.query;
  const { data, error } = await supabase
    .from('gd_participants')
    .select('*')
    .eq('session_id', req.params.id)
    .eq('join_token', token)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Invalid link' });

  await supabase
    .from('gd_participants')
    .update({ joined_at: new Date() })
    .eq('id', data.id);

  res.json({ participant: data });
});

// Shortlist selected students
app.post('/api/gd/:id/shortlist', async (req, res) => {
  const { participantIds } = req.body;

  await supabase
    .from('gd_participants')
    .update({ shortlisted: true })
    .in('id', participantIds);

  // Get their details and send emails
  const { data: parts } = await supabase
    .from('gd_participants')
    .select('*')
    .in('id', participantIds);

  const { data: session } = await supabase
    .from('gd_sessions')
    .select('topic')
    .eq('id', req.params.id)
    .single();

  for (const p of parts) {
    await sendGDShortlistEmail({
      studentName: p.candidate_name,
      studentEmail: p.candidate_email,
      topic: session.topic,
    });
  }

  res.json({ success: true });
});