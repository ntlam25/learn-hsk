const { supabase } = require('../config/supabase');

async function getMood() {
  const { data, error } = await supabase.from('site_settings').select('mood').eq('id', 1).single();
  if (error) throw error;
  return data.mood;
}

async function setMood(mood, updatedBy) {
  const { data, error } = await supabase
    .from('site_settings')
    .update({ mood, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select('mood')
    .single();
  if (error) throw error;
  return data.mood;
}

module.exports = { getMood, setMood };
