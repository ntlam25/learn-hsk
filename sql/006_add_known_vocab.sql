-- Chạy 1 lần trong Supabase SQL Editor: lưu danh sách từ học viên đã đánh dấu "đã thuộc" (nút ✓ trên thẻ từ)
-- để thanh tiến độ "Đã thuộc N/M" không bị mất khi tải lại trang / đổi máy.
alter table lesson_progress add column if not exists known_vocab jsonb not null default '[]'::jsonb;
