const fetch = require('node-fetch'); // npm install node-fetch@2

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_BASE = 'https://api.daily.co/v1';

async function createGDRoom(sessionId, durationMinutes) {
  const res = await fetch(`${DAILY_BASE}/rooms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `gd-${sessionId}`,
      privacy: 'private',
      properties: {
        exp: Math.floor(Date.now() / 1000) + durationMinutes * 60 + 600,
        enable_chat: false,
        max_participants: 10,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Daily.co room creation failed. Full response:', JSON.stringify(data, null, 2));
    throw new Error(data.info || data.error || 'Could not create Daily room');
  }
  return data;
}

async function createMeetingToken(roomName, userName) {
  const res = await fetch(`${DAILY_BASE}/meeting-tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { room_name: roomName, user_name: userName },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not create meeting token');
  return data.token;
}

async function getRecordings(roomName) {
  const res = await fetch(`${DAILY_BASE}/recordings?room_name=${roomName}`, {
    headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
  });
  return res.json();
}

module.exports = { createGDRoom, createMeetingToken, getRecordings };