const { supabase } = require('../config/supabase');

function unwrapSingle({ data, error }) {
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    createdAt: row.created_at,
  };
}

async function findByUsername(username) {
  const res = await supabase
    .from('users')
    .select('*')
    .eq('username', username.trim().toLowerCase())
    .single();
  return unwrapSingle(res);
}

async function findByEmail(email) {
  const res = await supabase
    .from('users')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .single();
  return unwrapSingle(res);
}

// Đăng nhập chấp nhận username HOẶC email — thử lần lượt từng cột bằng .eq() an toàn
// (không ghép chuỗi filter thô để tránh injection vào cú pháp filter của PostgREST).
async function findByIdentifier(identifier) {
  const value = identifier.trim().toLowerCase();
  const byUsername = await findByUsername(value);
  if (byUsername) return byUsername;
  return findByEmail(value);
}

async function findById(id) {
  const res = await supabase.from('users').select('*').eq('id', id).single();
  return unwrapSingle(res);
}

async function create({ username, email, passwordHash, fullName = '', role = 'student' }) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      username: username.trim().toLowerCase(),
      email: email ? email.trim().toLowerCase() : null, // tài khoản GV tạo sẵn có thể không có email
      password_hash: passwordHash,
      full_name: fullName,
      role,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function listByRole(role) {
  const { data, error } = await supabase.from('users').select('*').eq('role', role).order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(fromRow);
}

async function listAll({ search, role } = {}) {
  let query = supabase.from('users').select('*').order('created_at', { ascending: false });
  if (role) query = query.eq('role', role);
  if (search) {
    const term = search.trim().replace(/[%,]/g, '');
    if (term) query = query.or(`username.ilike.%${term}%,email.ilike.%${term}%,full_name.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data.map(fromRow);
}

async function updateRole(id, role) {
  const { data, error } = await supabase.from('users').update({ role }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function remove(id) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}

async function updateProfile(id, { fullName, avatarUrl }) {
  const row = {};
  if (fullName !== undefined) row.full_name = fullName;
  if (avatarUrl !== undefined) row.avatar_url = avatarUrl;
  const { data, error } = await supabase.from('users').update(row).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

module.exports = {
  findByUsername,
  findByEmail,
  findByIdentifier,
  findById,
  create,
  listByRole,
  listAll,
  updateRole,
  remove,
  updateProfile,
  fromRow,
};
