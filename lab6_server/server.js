const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { mkdir, appendFile } = require('node:fs/promises');
const express = require('express');

const app = express();

const HOST = '0.0.0.0';
const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.jsonl');

const TOPICS = ['question', 'cooperation', 'other'];
const LIMITS = { name: 100, email: 254, subject: 150, message: 2000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.use(express.static(PUBLIC_DIR));
app.use(express.json({ limit: '10kb' }));

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object.';
  }

  const { name, email, subject, message, topic } = body;

  for (const [field, value] of Object.entries({ name, email, subject, message })) {
    if (typeof value !== 'string') return `Field "${field}" must be a string.`;
    if (value.trim() === '') return `Field "${field}" is required.`;
    if (value.trim().length > LIMITS[field]) {
      return `Field "${field}" must be at most ${LIMITS[field]} characters.`;
    }
  }

  if (!EMAIL_RE.test(email.trim())) return 'A valid email address is required.';

  if (typeof topic !== 'string' || !TOPICS.includes(topic)) {
    return 'Field "topic" must be one of: ' + TOPICS.join(', ') + '.';
  }

  return null;
}

app.post('/api/contact', async (req, res) => {
  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ ok: false, error });
  }

  const { name, email, subject, message, topic } = req.body;

  const record = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    name: name.trim(),
    email: email.trim(),
    topic,
    subject: subject.trim(),
    message: message.trim()
  };

  try {
    await mkdir(DATA_DIR, { recursive: true });
    await appendFile(FEEDBACK_FILE, JSON.stringify(record) + '\n', 'utf8');
    res.status(201).json({ ok: true, message: 'Feedback saved locally.', id: record.id });
  } catch (err) {
    console.error('Failed to save feedback:', err);
    res.status(500).json({ ok: false, error: 'Internal server error.' });
  }
});

app.use((err, req, res, next) => {
  if (err.status >= 400 && err.status < 500) {
    const text = err.type === 'entity.too.large'
      ? 'Request body is too large.'
      : 'Request body must be valid JSON.';
    return res.status(400).json({ ok: false, error: text });
  }
  console.error(err);
  res.status(500).json({ ok: false, error: 'Internal server error.' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});