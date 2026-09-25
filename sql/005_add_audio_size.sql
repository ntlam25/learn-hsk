-- Chạy 1 lần trong Supabase SQL Editor: thêm dung lượng file nghe để trang xem bài hiển thị
-- "Thời lượng 0:31 · 0.5 MB · Mã 01-2" giống giáo trình gốc.
alter table lesson_audio_tracks add column if not exists size_bytes bigint;
