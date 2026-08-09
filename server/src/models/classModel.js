const { supabase } = require('../config/supabase');

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    courseId: row.course_id,
    teacherId: row.teacher_id,
    name: row.name,
    createdAt: row.created_at,
    courseTitle: row.courses?.title,
  };
}

function unwrapSingle({ data, error }) {
  if (error && error.code !== 'PGRST116') throw error;
  return fromRow(data);
}

// Admin thấy tất cả lớp; giáo viên chỉ thấy lớp mình dạy.
async function list({ teacherId } = {}) {
  let query = supabase.from('classes').select('*, courses(title)').order('created_at', { ascending: false });
  if (teacherId) query = query.eq('teacher_id', teacherId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(fromRow);
}

async function getById(id) {
  const res = await supabase.from('classes').select('*, courses(title)').eq('id', id).single();
  return unwrapSingle(res);
}

async function create({ courseId, teacherId, name }) {
  const { data, error } = await supabase
    .from('classes')
    .insert({ course_id: courseId, teacher_id: teacherId, name })
    .select('*, courses(title)')
    .single();
  if (error) throw error;
  return fromRow(data);
}

function toRow(payload) {
  const row = {};
  if (payload.courseId !== undefined) row.course_id = payload.courseId;
  if (payload.name !== undefined) row.name = payload.name;
  return row;
}

async function update(id, payload) {
  const { data, error } = await supabase
    .from('classes')
    .update(toRow(payload))
    .eq('id', id)
    .select('*, courses(title)')
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return fromRow(data);
}

async function remove(id) {
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) throw error;
}

module.exports = { list, getById, create, update, remove };
