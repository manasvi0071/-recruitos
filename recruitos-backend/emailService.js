const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL;

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

module.exports = {
  sendCollegeOutreachEmail,
  sendStudentSelectionEmail,
  sendCollegeSelectionEmail,
  sendCompanySelectionEmail,
  sendGDInviteEmail,
  sendGDShortlistEmail,
};