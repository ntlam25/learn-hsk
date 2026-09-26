const { supabase } = require('../config/supabase');

function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    hskLevel: row.hsk_level,
    createdBy: row.created_by,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lessonCount: row.course_lessons?.[0]?.count,
    classCount: row.classes?.[0]?.count,
  };
}

function toRow(payload) {
  const row = {};
  if (payload.title !== undefined) row.title = payload.title;
  if (payload.description !== undefined) row.description = payload.description;
  if (payload.hskLevel !== undefined) row.hsk_level = payload.hskLevel || null;
  if (payload.published !== undefined) row.published = payload.published;
  if (payload.createdBy !== undefined) row.created_by = payload.createdBy;
  return row;
}

function unwrapSingle({ data, error }) {
  if (error && error.code !== 'PGRST116') throw error;
  return fromRow(data);
}

async function listPublic() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('published', true)
    .order('hsk_level', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });
  if (error) throw error;
  return data.map(fromRow);
}

async function listAdmin() {
  const { data, error } = await supabase
    .from('courses')
    .select('*, course_lessons(count), classes(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

async function getById(id) {
  const res = await supabase.from('courses').select('*').eq('id', id).single();
  return unwrapSingle(res);
}

async function create(payload) {
  const { data, error } = await supabase.from('courses').insert(toRow(payload)).select().single();
  if (error) throw error;
  return fromRow(data);
}

async function update(id, payload) {
  const res = await supabase.from('courses').update(toRow(payload)).eq('id', id).select().single();
  return unwrapSingle(res);
}

async function remove(id) {
  const { data, error } = await supabase.from('courses').delete().eq('id', id).select().single();
  if (error && error.code !== 'PGRST116') throw error;
  return fromRow(data);
}

async function removeMany(ids) {
  const { data, error } = await supabase.from('courses').delete().in('id', ids).select('id');
  if (error) throw error;
  return data.length;
}

module.exports = { listPublic, listAdmin, getById, create, update, remove, removeMany };
