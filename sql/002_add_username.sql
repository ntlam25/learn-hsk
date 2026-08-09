-- Chạy 1 lần trong Supabase SQL Editor nếu project của bạn đã tạo bảng `users`
-- từ trước (theo schema.sql cũ chưa có cột username). Bổ sung username làm định
-- danh đăng nhập chính, song song với email.

alter table users add column if not exists username text;

-- Backfill username cho các tài khoản đã có: lấy phần trước @ trong email làm username tạm.
-- Nếu trùng nhau (2 email khác domain cùng phần trước @) sẽ nối thêm số thứ tự.
with numbered as (
  select id, email,
         split_part(email, '@', 1) as base,
         row_number() over (partition by split_part(email, '@', 1) order by created_at) as rn
  from users
  where username is null
)
update users u
set username = case when n.rn = 1 then n.base else n.base || n.rn::text end
from numbered n
where u.id = n.id;

alter table users alter column username set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_username_key'
  ) then
    alter table users add constraint users_username_key unique (username);
  end if;
end $$;
