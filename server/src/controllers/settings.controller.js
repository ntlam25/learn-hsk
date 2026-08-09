const settingsModel = require('../models/settingsModel');

// GET /api/settings (public) — frontend fetch lúc load để set mood giao diện
async function getMood(req, res) {
  const mood = await settingsModel.getMood();
  res.json({ mood });
}

// PUT /api/admin/settings/mood  body: { mood } (chỉ admin)
async function setMood(req, res) {
  const { mood } = req.body;
  const ALLOWED = ['vui', 'buon', 'tap_trung', 'thu_gian'];
  if (!ALLOWED.includes(mood)) {
    return res.status(400).json({ message: `mood phải là một trong: ${ALLOWED.join(', ')}` });
  }
  const saved = await settingsModel.setMood(mood, req.user.id);
  res.json({ mood: saved });
}

module.exports = { getMood, setMood };
