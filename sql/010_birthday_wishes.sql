-- Chạy 1 lần trong Supabase SQL Editor.
-- Lưu điều ước được treo trên "cây ước nguyện" ở trang /sinh-nhat-mai.
-- Server ghi bằng service-role key; bật RLS để client không đọc/ghi trực tiếp được.

create table if not exists birthday_wishes (
  id uuid primary key default gen_random_uuid(),
  recipient text not null default 'mai',
  content text not null check (char_length(content) between 1 and 200),
  created_at timestamptz not null default now()
);
create index if not exists idx_birthday_wishes_recipient on birthday_wishes (recipient, created_at desc);
alter table birthday_wishes enable row level security;
