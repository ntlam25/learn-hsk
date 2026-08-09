-- Chạy 1 lần trong Supabase SQL Editor nếu bảng `lesson_audio_tracks` đã tồn tại
-- từ trước (theo schema.sql cũ chưa có duration_sec/code). Dùng cho trình soạn
-- bài học mới hiển thị "Thời lượng · Mã file" trên mỗi file nghe.

alter table lesson_audio_tracks add column if not exists duration_sec numeric;
alter table lesson_audio_tracks add column if not exists code text not null default '';
