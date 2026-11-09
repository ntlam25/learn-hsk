const { supabase } = require('../config/supabase');

async function addWish(recipient, content) {
  const { data, error } = await supabase
    .from('birthday_wishes')
    .insert({ recipient, content })
    .select('id, recipient, content, created_at')
    .single();
  if (error) throw error;
  return data;
}

async function listWishes(recipient) {
  const { data, error } = await supabase
    .from('birthday_wishes')
    .select('id, recipient, content, created_at')
    .eq('recipient', recipient)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function deleteWish(id) {
  const { error } = await supabase.from('birthday_wishes').delete().eq('id', id);
  if (error) throw error;
}

async function getPage(slug) {
  const { data, error } = await supabase
    .from('birthday_pages')
    .select('slug, content, updated_at')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data; // null nếu chưa lưu lần nào
}

async function savePage(slug, content, updatedBy) {
  const { data, error } = await supabase
    .from('birthday_pages')
    .upsert({ slug, content, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .select('slug, content, updated_at')
    .single();
  if (error) throw error;
  return data;
}

module.exports = { addWish, listWishes, deleteWish, getPage, savePage };
