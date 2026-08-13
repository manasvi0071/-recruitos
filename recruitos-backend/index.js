require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { analyzeResume } = require('./resumeAnalyzer');
const { scoreGDSession } = require('./gdScorer');
const { generateEmail } = require('./generateEmailRoute');
const {
  sendCollegeOutreachEmail,
  sendStudentSelectionEmail,
  sendCollegeSelectionEmail,
  sendCompanySelectionEmail,
  sendGDInviteEmail,
  sendGDShortlistEmail,
} = require('./emailService');

const aiInterviewRoutes = require('./aiInterviewRoutes');
const aptitudeRoutes = require('./aptitudeRoutes');
const { createGDRoom, createMeetingToken } = require('./dailyService');
const jdRoutes = require('./jdRoutes');
const { moveApplicationStage } = require('./pipelineSync');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/ai-interview', aiInterviewRoutes);
app.use('/api/aptitude', aptitudeRoutes);
app.use('/api/jd', jdRoutes);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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

// ---- GENERATE EMAIL (Comm.jsx "Generate with AI" button) ----
app.post('/api/generate-email', generateEmail);

// Create GD Session
app.post('/api/gd/create', async (req, res) => {
  try {
    const { topic, duration_minutes, job_id, candidates } = req.body;

    const dailyRoom = await createGDRoom(`gd-${Date.now()}`, duration_minutes);

    const { data: session, error } = await supabase
      .from('gd_sessions')
      .insert([{ topic, duration_minutes, job_id, daily_room_url: dailyRoom.url, daily_room_name: dailyRoom.name }])
      .select()
      .single();

    if (error) return res.status(500).json({ error });

    const participants = candidates.map(c => ({
      session_id: session.id,
      candidate_id: c.id,
      candidate_name: c.name,
      candidate_email: c.email,
    }));

    const { data: parts, error: partsError } = await supabase
      .from('gd_participants')
      .insert(participants)
      .select();

    if (partsError) {
      console.error('GD participants insert error:', partsError);
      return res.status(500).json({ error: partsError.message || partsError });
    }

    for (const p of parts) {
      try {
        await sendGDInviteEmail({
          studentName: p.candidate_name,
          studentEmail: p.candidate_email,
          topic: session.topic,
          duration: duration_minutes,
          joinLink: `${process.env.FRONTEND_URL}/gd/${session.id}?token=${p.join_token}`,
        });
      } catch (emailErr) {
        console.error(`Failed to send GD invite email to ${p.candidate_email}:`, emailErr);
      }
    }

    res.json({ success: true, session });
  } catch (err) {
    console.error('GD create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create an OFFLINE GD session — no video room, no emails, just a shell for manual ratings
app.post('/api/gd/create-offline', async (req, res) => {
  try {
    const { topic, candidates } = req.body;

    if (!topic || !candidates || candidates.length === 0) {
      return res.status(400).json({ error: 'Topic and at least one candidate are required' });
    }

    const { data: session, error } = await supabase
      .from('gd_sessions')
      .insert([{ topic, duration_minutes: null, mode: 'offline', status: 'Ended' }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    const participants = candidates.map(c => ({
      session_id: session.id,
      candidate_id: c.id,
      candidate_name: c.name,
      candidate_email: c.email,
    }));

    const { error: partErr } = await supabase.from('gd_participants').insert(participants);
    if (partErr) return res.status(500).json({ error: partErr.message });

    res.json({ success: true, session });
  } catch (err) {
    console.error('Offline GD create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Manually add a GD result (for offline/in-person GD sessions)
app.post('/api/gd/manual', async (req, res) => {
  try {
    const { candidate_name, candidate_email, topic, confidence, communication, leadership, participation, knowledge, teamwork, notes } = req.body;

    if (!candidate_name || confidence == null || communication == null) {
      return res.status(400).json({ error: 'Candidate name and at least confidence/communication scores are required' });
    }

    const scores = [confidence, communication, leadership, participation, knowledge, teamwork].filter((s) => s != null);
    const overall = scores.length ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null;

    const { data, error } = await supabase
      .from('gd_participants')
      .insert([{
        candidate_name,
        candidate_email: candidate_email || null,
        topic: topic || 'Offline GD Round',
        confidence,
        communication,
        leadership,
        participation,
        knowledge,
        teamwork,
        overall,
        ai_feedback: notes || null,
        is_manual: true,
        joined_at: new Date(),
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true, participant: data });
  } catch (err) {
    console.error('Manual GD entry error:', err);
    res.status(500).json({ error: err.message });
  }
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
    .select('topic, job_id')
    .eq('id', req.params.id)
    .single();

  for (const p of parts) {
    await sendGDShortlistEmail({
      studentName: p.candidate_name,
      studentEmail: p.candidate_email,
      topic: session.topic,
    });

    // Pipeline sync: shortlisting from GD moves the candidate to Interview.
    if (p.candidate_id) {
      await moveApplicationStage(supabase, {
        candidateId: p.candidate_id,
        jobId: session?.job_id,
        fromStage: 'GD',
        toStage: 'Interview',
      });
    }
  }

  res.json({ success: true });
});

// Save/update Sir's manual rating for a GD participant
app.post('/api/gd/participant/:participantId/manual-rating', async (req, res) => {
  try {
    const { participantId } = req.params;
    const {
      confidence,
      communication,
      content_knowledge,
      leadership,
      teamwork,
      comment,
    } = req.body;

    const scoreFields = { confidence, communication, content_knowledge, leadership, teamwork };

    // Validate each score is an integer between 1 and 5
    for (const [key, value] of Object.entries(scoreFields)) {
      if (value === undefined || value === null) continue; // allow partial updates
      const num = Number(value);
      if (!Number.isInteger(num) || num < 1 || num > 5) {
        return res.status(400).json({ error: `${key} must be an integer between 1 and 5` });
      }
    }

    const updatePayload = {
      manual_confidence: confidence,
      manual_communication: communication,
      manual_content_knowledge: content_knowledge,
      manual_leadership: leadership,
      manual_teamwork: teamwork,
      manual_comment: comment || null,
      manual_rated_at: new Date(),
    };

    const { data, error } = await supabase
      .from('gd_participants')
      .update(updatePayload)
      .eq('id', participantId)
      .select()
      .single();

    if (error) {
      console.error('Manual rating update error:', error);
      return res.status(500).json({ error: error.message || error });
    }

    if (!data) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Pipeline sync: if the rated criteria average out to 3/5 or higher,
    // auto-move the candidate from GD to Interview on the pipeline board.
    const ratedValues = [confidence, communication, content_knowledge, leadership, teamwork]
      .filter((v) => v !== undefined && v !== null)
      .map(Number);

    if (ratedValues.length > 0 && data.candidate_id) {
      const avg = ratedValues.reduce((a, b) => a + b, 0) / ratedValues.length;
      if (avg >= 3) {
        const { data: session } = await supabase
          .from('gd_sessions')
          .select('job_id')
          .eq('id', data.session_id)
          .single();

        await moveApplicationStage(supabase, {
          candidateId: data.candidate_id,
          jobId: session?.job_id,
          fromStage: 'GD',
          toStage: 'Interview',
        });
      }
    }

    res.json({ success: true, participant: data });
  } catch (err) {
    console.error('Manual rating error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/gd/:id/token', async (req, res) => {
  try {
    const { token } = req.query;
    const { data: participant, error } = await supabase
      .from('gd_participants')
      .select('*, gd_sessions(daily_room_name, daily_room_url)')
      .eq('session_id', req.params.id)
      .eq('join_token', token)
      .single();

    if (error || !participant) return res.status(404).json({ error: 'Invalid link' });

    const dailyToken = await createMeetingToken(
      participant.gd_sessions.daily_room_name,
      participant.candidate_name
    );

    res.json({
      dailyToken,
      roomUrl: participant.gd_sessions.daily_room_url,
      candidateName: participant.candidate_name,
    });
  } catch (err) {
    console.error('GD token error:', err);
    res.status(500).json({ error: err.message });
  }
});

const { sendAdminApprovalNotification } = require('./emailService');

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) return res.status(400).json({ error: authError.message });

    const { error: profileError } = await supabase.from('profiles').insert([{
      id: authData.user.id,
      email,
      name,
      role,
      approved: role === 'candidate', // candidates auto-approved, recruiter/corporate need admin approval
    }]);
    if (profileError) return res.status(500).json({ error: profileError.message });

    res.json({ success: true, message: role === 'candidate' ? 'Account created!' : 'Registration submitted. Await admin approval.' });

    sendAdminApprovalNotification({ name, email, role }).catch((err) =>
      console.error('Admin notification email failed:', err)
    );
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function requireAdmin(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', userId).single();
  if (error || !profile || profile.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
// Admin: list all pending users
app.get('/api/auth/pending', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('approved', false).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin: approve a user
app.post('/api/auth/approve/:userId', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('profiles').update({ approved: true }).eq('id', req.params.userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Admin: reject/delete a pending user
app.post('/api/auth/reject/:userId', requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const { error } = await supabase.from('profiles').update({ approved: false, status: 'denied' }).eq('id', userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Log a new call
app.post('/api/calls', async (req, res) => {
  try {
    const { recruiter_id, recruiter_name, college_id, college_name, call_date, duration_minutes, notes, outcome } = req.body;
    const { data, error } = await supabase.from('call_logs').insert([{
      recruiter_id, recruiter_name, college_id, college_name,
      call_date: call_date || new Date(), duration_minutes, notes, outcome,
    }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, call: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all call logs (for reports)
app.get('/api/calls', async (req, res) => {
  const { data, error } = await supabase.from('call_logs').select('*').order('call_date', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get recruiter performance summary
app.get('/api/calls/performance', async (req, res) => {
  const { data: calls, error } = await supabase.from('call_logs').select('*');
  if (error) return res.status(500).json({ error: error.message });

  const { data: candidates } = await supabase.from('candidates').select('id, college_id, assigned_recruiter_id');

  const byRecruiter = {};
  calls.forEach((c) => {
    if (!byRecruiter[c.recruiter_id]) {
      byRecruiter[c.recruiter_id] = {
        recruiter_id: c.recruiter_id,
        recruiter_name: c.recruiter_name,
        totalCalls: 0,
        totalMinutes: 0,
        collegesContacted: new Set(),
        calls: [],
      };
    }
    const r = byRecruiter[c.recruiter_id];
    r.totalCalls += 1;
    r.totalMinutes += c.duration_minutes || 0;
    if (c.college_name) r.collegesContacted.add(c.college_name);
    r.calls.push(c);
  });

  const result = Object.values(byRecruiter).map((r) => ({
    ...r,
    collegesContacted: r.collegesContacted.size,
    studentsUnder: candidates ? candidates.filter((cand) => cand.assigned_recruiter_id === r.recruiter_id).length : 0,
  }));

  res.json(result);
});

// Local development only — on Vercel this file is loaded as a serverless
// function via module.exports, so app.listen must not run there.
if (require.main === module) {
  app.listen(5000, () => console.log('✅ RecruitOS backend running on http://localhost:5000'));
}

module.exports = app;