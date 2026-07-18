const { generateAIEmailContent } = require('./emailService');

async function generateEmail(req, res) {
  try {
    const { entityType, entityName, hint } = req.body;
    const { subject, body } = await generateAIEmailContent({
      recipientType: entityType,
      recipientName: entityName,
      context: hint,
    });
    // Comm.jsx's note field expects a single string — combine subject + body.
    res.status(200).json({ email: `Subject: ${subject}\n\n${body}` });
  } catch (err) {
    console.error('generateEmail route failed:', err);
    res.status(500).json({ error: 'Could not generate email. Please try again.' });
  }
}

module.exports = { generateEmail };
