-- Chạy 1 lần trong Supabase SQL Editor (sau 006): luồng Khoá học → Lớp học → Bài học.
--  • Lớp có mã mời, ngày bắt đầu/kết thúc, lưu trữ.
--  • Giáo viên mở/khoá từng bài cho từng lớp (class_lessons).
--  • Ghi thời điểm hoàn thành bài; cho phép tài khoản học viên không có email (GV tạo sẵn).

-- Mã mời 6 ký tự (bỏ các ký tự dễ nhầm 0/O/1/I/L)
create or replace function gen_join_code() returns text language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 6)
$$;

alter table classes add column if not exists join_code text;
alter table classes add column if not exists join_enabled boolean not null default true;
alter table classes add column if not exists start_date date;
alter table classes add column if not exists end_date date;
alter table classes add column if not exists archived boolean not null default false;
update classes set join_code = gen_join_code() where join_code is null;
alter table classes alter column join_code set default gen_join_code();
alter table classes alter column join_code set not null;
create unique index if not exists idx_classes_join_code on classes (join_code);

create table if not exists class_lessons (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  released boolean not null default false,
  release_at timestamptz,
  unique (class_id, lesson_id)
);
create index if not exists idx_class_lessons_class on class_lessons (class_id);
alter table class_lessons enable row level security;

-- Giữ nguyên hành vi cũ cho các lớp đang có: mọi bài hiện tại của khoá đều đã mở
insert into class_lessons (class_id, lesson_id, released)
select c.id, l.id, true
from classes c
join lessons l on l.course_id = c.course_id
on conflict (class_id, lesson_id) do nothing;

alter table lesson_progress add column if not exists completed_at timestamptz;

alter table users alter column email drop not null;
