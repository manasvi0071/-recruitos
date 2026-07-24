const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL;

// ─── AI EMAIL GENERATION — used by the Communication CRM "Generate with AI" button ───
// Calls the Claude API server-side (API key never touches the browser) to draft a
// subject + body for an ad-hoc communication, then wraps it in the same RecruitOS
// branded template used by the rest of this file.

async function generateAIEmailContent({ recipientType, recipientName, context }) {
  const prompt = `You are writing a short, professional email on behalf of "Talent Corner", a campus recruitment agency, for their RecruitOS platform.

Recipient type: ${recipientType === 'college' ? 'College placement cell (TPO)' : recipientType === 'company' ? 'Hiring company HR contact' : 'Student'}
Recipient name: ${recipientName || 'the recipient'}
${context ? `Context / purpose of this email: ${context}` : 'Context: a routine recruitment update — use your best judgement for the subject.'}

Respond in exactly this format, nothing else:
Subject: <subject line>
---
<email body only, no greeting salutation issues, plain text, under 130 words, professional and warm tone, sign off as "Talent Corner Recruitment Team">`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
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
  const raw = data.choices[0].message.content.trim();

  const [subjectLine, ...rest] = raw.split('---');
  const subject = subjectLine.replace(/^Subject:\s*/i, '').trim();
  const body = rest.join('---').trim();

  return { subject, body };
}

// Sends the AI-drafted content using the same branded template as the rest of this file.
async function sendAIGeneratedEmail({ toEmail, toName, recipientType, context }) {
  const { subject, body } = await generateAIEmailContent({ recipientType, recipientName: toName, context });

  const bodyHtml = body
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p style="margin:0 0 12px;">${line}</p>`)
    .join('');

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject,
    html: `
      <div style="font-family:Inter,sans-serif; max-width:580px; margin:auto; padding:32px; color:#33363F;">
        <div style="background:#0A0C12; padding:20px 28px; border-radius:10px; margin-bottom:28px;">
          <h2 style="color:#EDE6D6; font-family:Georgia,serif; margin:0;">RecruitOS</h2>
          <p style="color:#9C8054; font-size:11px; margin:4px 0 0; text-transform:uppercase; letter-spacing:0.08em;">Talent Corner — Campus Recruitment Platform</p>
        </div>
        ${bodyHtml}
      </div>
    `,
  });

  return { subject, body };
}

// ─── 1. EMAIL TO COLLEGE when drive is announced ───
async function sendCollegeOutreachEmail({ tpoName, collegeName, tpoEmail, jobTitle, company, driveDate }) {
  await resend.emails.send({
    from: FROM,
    to: tpoEmail,
    subject: `Campus Drive Invitation — ${jobTitle} at ${company}`,
    html: `
      <div style="font-family:Inter,sans-serif; max-width:580px; margin:auto; padding:32px; color:#33363F;">
        <div style="background:#0A0C12; padding:20px 28px; border-radius:10px; margin-bottom:28px;">
          <h2 style="color:#EDE6D6; font-family:Georgia,serif; margin:0;">RecruitOS</h2>
          <p style="color:#9C8054; font-size:11px; margin:4px 0 0; text-transform:uppercase; letter-spacing:0.08em;">Campus Recruitment Platform — Talent Corner</p>
        </div>
        <p>Dear <strong>${tpoName}</strong>,</p>
        <p>Greetings from <strong>Talent Corner</strong>! We are pleased to invite <strong>${collegeName}</strong> to participate in an upcoming campus recruitment drive.</p>
        <div style="background:#FAF8F4; border:1px solid #E6E2D6; border-radius:10px; padding:20px 24px; margin:20px 0;">
          <p style="margin:0 0 8px;"><strong>Role:</strong> ${jobTitle}</p>
          <p style="margin:0 0 8px;"><strong>Company:</strong> ${company}</p>
          <p style="margin:0;"><strong>Drive Date:</strong> ${driveDate}</p>
        </div>
        <p>Kindly share this opportunity with your eligible students and confirm your college's participation by replying to this email.</p>
        <p>We look forward to your response.</p>
        <p>Warm regards,<br/><strong>Talent Corner Recruitment Team</strong></p>
      </div>
    `,
  });
}

// ─── 2. EMAIL TO STUDENT when selected ───
async function sendStudentSelectionEmail({ studentName, studentEmail, jobTitle, company, ctc }) {
  await resend.emails.send({
    from: FROM,
    to: studentEmail,
    subject: `🎉 Congratulations! You are Selected — ${jobTitle} at ${company}`,
    html: `
      <div style="font-family:Inter,sans-serif; max-width:580px; margin:auto; padding:32px; color:#33363F;">
        <div style="background:#0A0C12; padding:20px 28px; border-radius:10px; margin-bottom:28px;">
          <h2 style="color:#EDE6D6; font-family:Georgia,serif; margin:0;">RecruitOS</h2>
          <p style="color:#9C8054; font-size:11px; margin:4px 0 0; text-transform:uppercase; letter-spacing:0.08em;">Talent Corner — Campus Recruitment Platform</p>
        </div>
        <h2 style="color:#0A0C12; font-family:Georgia,serif;">Congratulations, ${studentName}! 🎉</h2>
        <p>We are delighted to inform you that you have been <strong>selected</strong> for the following position:</p>
        <div style="background:#E1ECE6; border-left:4px solid #1F6F54; border-radius:8px; padding:20px 24px; margin:20px 0;">
          <p style="margin:0 0 8px; color:#1F6F54;"><strong>✅ Role:</strong> ${jobTitle}</p>
          <p style="margin:0 0 8px; color:#1F6F54;"><strong>✅ Company:</strong> ${company}</p>
          <p style="margin:0; color:#1F6F54;"><strong>✅ CTC:</strong> ${ctc}</p>
        </div>
        <p>Your offer letter will be sent to you shortly. Please keep an eye on your email.</p>
        <p>This is a proud moment — well deserved! Wishing you all the very best in your career ahead.</p>
        <p>Warm regards,<br/><strong>Talent Corner Recruitment Team</strong></p>
      </div>
    `,
  });
}

// ─── 3. EMAIL TO COLLEGE when their student is selected ───
async function sendCollegeSelectionEmail({ tpoName, tpoEmail, collegeName, studentName, jobTitle, company }) {
  await resend.emails.send({
    from: FROM,
    to: tpoEmail,
    subject: `Selection Update — ${studentName} from ${collegeName} Selected`,
    html: `
      <div style="font-family:Inter,sans-serif; max-width:580px; margin:auto; padding:32px; color:#33363F;">
        <div style="background:#0A0C12; padding:20px 28px; border-radius:10px; margin-bottom:28px;">
          <h2 style="color:#EDE6D6; font-family:Georgia,serif; margin:0;">RecruitOS</h2>
          <p style="color:#9C8054; font-size:11px; margin:4px 0 0; text-transform:uppercase; letter-spacing:0.08em;">Talent Corner — Campus Recruitment Platform</p>
        </div>
        <p>Dear <strong>${tpoName}</strong>,</p>
        <p>We are pleased to inform you that the following student from <strong>${collegeName}</strong> has been <strong>selected</strong> in our recruitment drive:</p>
        <div style="background:#FAF8F4; border:1px solid #E6E2D6; border-radius:10px; padding:20px 24px; margin:20px 0;">
          <p style="margin:0 0 8px;"><strong>Student Name:</strong> ${studentName}</p>
          <p style="margin:0 0 8px;"><strong>Selected For:</strong> ${jobTitle}</p>
          <p style="margin:0;"><strong>Company:</strong> ${company}</p>
        </div>
        <p>Please convey our congratulations to the student and the placement cell.</p>
        <p>Warm regards,<br/><strong>Talent Corner Recruitment Team</strong></p>
      </div>
    `,
  });
}

// ─── 4. EMAIL TO COMPANY when candidate is selected for them ───
async function sendCompanySelectionEmail({ hrName, hrEmail, company, studentName, jobTitle, studentEmail, studentPhone }) {
  await resend.emails.send({
    from: FROM,
    to: hrEmail,
    subject: `Selected Candidate for ${jobTitle} — ${studentName}`,
    html: `
      <div style="font-family:Inter,sans-serif; max-width:580px; margin:auto; padding:32px; color:#33363F;">
        <div style="background:#0A0C12; padding:20px 28px; border-radius:10px; margin-bottom:28px;">
          <h2 style="color:#EDE6D6; font-family:Georgia,serif; margin:0;">RecruitOS</h2>
          <p style="color:#9C8054; font-size:11px; margin:4px 0 0; text-transform:uppercase; letter-spacing:0.08em;">Talent Corner — Campus Recruitment Platform</p>
        </div>
        <p>Dear <strong>${hrName}</strong>,</p>
        <p>Please find below the details of the selected candidate for the <strong>${jobTitle}</strong> role at <strong>${company}</strong>:</p>
        <div style="background:#FAF8F4; border:1px solid #E6E2D6; border-radius:10px; padding:20px 24px; margin:20px 0;">
          <p style="margin:0 0 8px;"><strong>Name:</strong> ${studentName}</p>
          <p style="margin:0 0 8px;"><strong>Email:</strong> ${studentEmail}</p>
          <p style="margin:0 0 8px;"><strong>Phone:</strong> ${studentPhone}</p>
          <p style="margin:0;"><strong>Role:</strong> ${jobTitle}</p>
        </div>
        <p>The offer letter will be dispatched shortly. Please let us know if you need any additional information.</p>
        <p>Warm regards,<br/><strong>Talent Corner Recruitment Team</strong></p>
      </div>
    `,
  });
}

async function sendGDInviteEmail({ studentName, studentEmail, topic, duration, joinLink }) {
  await resend.emails.send({
    from: FROM,
    to: studentEmail,
    subject: 'You are invited to Group Discussion — RecruitOS',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:580px;margin:auto;padding:32px;color:#33363F;">
        <div style="background:#0A0C12;padding:20px 28px;border-radius:10px;margin-bottom:28px;">
          <h2 style="color:#EDE6D6;font-family:Georgia,serif;margin:0;">RecruitOS</h2>
          <p style="color:#9C8054;font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.08em;">Talent Corner — Campus Recruitment</p>
        </div>
        <h2 style="color:#0A0C12;font-family:Georgia,serif;">GD Invitation, ${studentName}!</h2>
        <p>You have been selected to participate in a <strong>Group Discussion</strong> round.</p>
        <div style="background:#FAF8F4;border:1px solid #E6E2D6;border-radius:10px;padding:20px 24px;margin:20px 0;">
          <p style="margin:0 0 8px;"><strong>Topic:</strong> ${topic}</p>
          <p style="margin:0;"><strong>Duration:</strong> ${duration} minutes</p>
        </div>
        <p>Click the button below to join your GD room:</p>
        <a href="${joinLink}" style="display:inline-block;background:#0A0C12;color:#EDE6D6;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0;">
          Join GD Room
        </a>
        <p style="margin-top:16px;font-size:12px;color:#8B8E97;">This link is personal to you. Do not share it with others.</p>
        <p>Best of luck!<br/><strong>Talent Corner Recruitment Team</strong></p>
      </div>`,
  });
}

async function sendGDShortlistEmail({ studentName, studentEmail, topic }) {
  await resend.emails.send({
    from: FROM,
    to: studentEmail,
    subject: 'Congratulations! You cleared the GD Round — RecruitOS',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:580px;margin:auto;padding:32px;color:#33363F;">
        <div style="background:#0A0C12;padding:20px 28px;border-radius:10px;margin-bottom:28px;">
          <h2 style="color:#EDE6D6;font-family:Georgia,serif;margin:0;">RecruitOS</h2>
          <p style="color:#9C8054;font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.08em;">Talent Corner — Campus Recruitment</p>
        </div>
        <h2 style="color:#1F6F54;font-family:Georgia,serif;">Congratulations, ${studentName}! 🎉</h2>
        <p>We are pleased to inform you that you have been <strong>shortlisted</strong> after the Group Discussion round.</p>
        <div style="background:#E1ECE6;border-left:4px solid #1F6F54;border-radius:8px;padding:20px 24px;margin:20px 0;">
          <p style="margin:0;color:#1F6F54;"><strong>GD Topic:</strong> ${topic}</p>
        </div>
        <p>You will be contacted shortly with details about the next round.</p>
        <p>Well done!<br/><strong>Talent Corner Recruitment Team</strong></p>
      </div>`,
  });
}

async function sendAIInterviewInviteEmail({ studentName, studentEmail, jobTitle, company, interviewLink }) {
  await resend.emails.send({
    from: FROM,
    to: studentEmail,
    subject: `Your AI Interview — ${jobTitle}${company ? ` at ${company}` : ''}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:580px;margin:auto;padding:32px;color:#33363F;">
        <div style="background:#0A0C12;padding:20px 28px;border-radius:10px;margin-bottom:28px;">
          <h2 style="color:#EDE6D6;font-family:Georgia,serif;margin:0;">RecruitOS</h2>
          <p style="color:#9C8054;font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:0.08em;">Talent Corner — Campus Recruitment</p>
        </div>
        <h2 style="color:#0A0C12;font-family:Georgia,serif;">Hi ${studentName}, it's interview time!</h2>
        <p>You've been shortlisted for a short AI-conducted screening interview for:</p>
        <div style="background:#FAF8F4;border:1px solid #E6E2D6;border-radius:10px;padding:20px 24px;margin:20px 0;">
          <p style="margin:0 0 8px;"><strong>Role:</strong> ${jobTitle}</p>
          ${company ? `<p style="margin:0;"><strong>Company:</strong> ${company}</p>` : ''}
        </div>
        <p>Click the button below to start. It's a friendly text-based interview and takes about 5-10 minutes.</p>
        <a href="${interviewLink}" style="display:inline-block;background:#0A0C12;color:#EDE6D6;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0;">
          Start Interview
        </a>
        <p style="margin-top:16px;font-size:12px;color:#8B8E97;">This link is personal to you. Do not share it with others.</p>
        <p>Best of luck!<br/><strong>Talent Corner Recruitment Team</strong></p>
      </div>`,
  });
}

module.exports = {
  generateAIEmailContent,
  sendAIGeneratedEmail,
  sendCollegeOutreachEmail,
  sendStudentSelectionEmail,
  sendCollegeSelectionEmail,
  sendCompanySelectionEmail,
  sendGDInviteEmail,
  sendGDShortlistEmail,
  sendAIInterviewInviteEmail,
};