-- Chạy 1 lần trong Supabase SQL Editor (sau 010).
-- Nội dung trang mừng sinh nhật (tên, ngày sinh, ảnh, lời chúc, thư…) lưu dạng JSON,
-- sửa ở trang quản trị /admin/birthday. Chưa có dòng nào thì trang dùng nội dung mặc định.

create table if not exists birthday_pages (
  slug text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table birthday_pages enable row level security;
