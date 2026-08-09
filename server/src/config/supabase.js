const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_BUCKET || 'lesson-media';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY (xem server/.env.example).'
  );
}

// service_role key bỏ qua RLS — client này chỉ được dùng ở backend, không bao giờ
// gửi xuống frontend. persistSession:false vì đây là server, không phải trình duyệt.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = { supabase, BUCKET };
