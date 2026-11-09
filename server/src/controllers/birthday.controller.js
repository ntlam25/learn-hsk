const birthdayModel = require('../models/birthdayModel');

const RECIPIENTS = ['mai'];
const MAX_LEN = 100;

// Chống spam đơn giản cho endpoint công khai: tối đa 20 điều ước / 10 phút / IP
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear(); // tránh map phình mãi
  return false;
}

// POST /api/birthday/wishes  body: { content, recipient? } (public, trang sinh nhật gọi khi treo điều ước)
async function addWish(req, res) {
  const recipient = String(req.body?.recipient || 'mai');
  const content = String(req.body?.content ?? '').trim();
  if (!RECIPIENTS.includes(recipient)) return res.status(400).json({ message: 'recipient không hợp lệ.' });
  if (!content) return res.status(400).json({ message: 'Điều ước không được để trống.' });
  if (content.length > MAX_LEN) return res.status(400).json({ message: `Điều ước tối đa ${MAX_LEN} ký tự.` });
  if (rateLimited(req.ip)) return res.status(429).json({ message: 'Ước nhiều quá rồi, nghỉ chút rồi ước tiếp nha.' });

  const wish = await birthdayModel.addWish(recipient, content);
  res.status(201).json({ wish });
}

// DELETE /api/birthday/wishes/:id (public) — gỡ điều ước khỏi cây.
// id là uuid chỉ trình duyệt đã treo điều ước mới biết (trả về lúc POST), nên dùng luôn làm "chìa khoá".
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function removeWish(req, res) {
  const { id } = req.params;
  if (!UUID_RE.test(id)) return res.status(400).json({ message: 'id không hợp lệ.' });
  if (rateLimited(req.ip)) return res.status(429).json({ message: 'Thao tác nhiều quá, nghỉ chút nha.' });
  await birthdayModel.deleteWish(id);
  res.status(204).end();
}

// GET /api/admin/birthday/wishes?recipient=mai (chỉ admin) — xem lại các điều ước
async function listWishes(req, res) {
  const recipient = String(req.query.recipient || 'mai');
  if (!RECIPIENTS.includes(recipient)) return res.status(400).json({ message: 'recipient không hợp lệ.' });
  const wishes = await birthdayModel.listWishes(recipient);
  res.json({ wishes });
}

// GET /api/birthday/pages/:slug (public) — trang sinh nhật tải nội dung; chưa có thì content = null
async function getPage(req, res) {
  const { slug } = req.params;
  if (!RECIPIENTS.includes(slug)) return res.status(404).json({ message: 'Không tìm thấy trang.' });
  const page = await birthdayModel.getPage(slug);
  res.json({ content: page?.content ?? null, updatedAt: page?.updated_at ?? null });
}

// PUT /api/admin/birthday/pages/:slug  body: { content } (chỉ admin)
async function savePage(req, res) {
  const { slug } = req.params;
  const { content } = req.body || {};
  if (!RECIPIENTS.includes(slug)) return res.status(404).json({ message: 'Không tìm thấy trang.' });
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return res.status(400).json({ message: 'content phải là một object.' });
  }
  if (JSON.stringify(content).length > 200_000) {
    return res.status(400).json({ message: 'Nội dung quá dài.' });
  }
  const page = await birthdayModel.savePage(slug, content, req.user.id);
  res.json({ content: page.content, updatedAt: page.updated_at });
}

module.exports = { addWish, listWishes, removeWish, getPage, savePage };
