-- Chạy 1 lần trong Supabase SQL Editor nếu bảng `users` đã tồn tại từ trước
-- (theo schema.sql cũ chưa có cột avatar_url). Dùng cho trang "Tài khoản của tôi".

alter table users add column if not exists avatar_url text;
