-- Chạy 1 lần trong Supabase SQL Editor (sau 007; chạy được dù đã hay chưa chạy 008).
-- Một bài học dùng lại được ở nhiều khoá: quan hệ khoá ↔ bài chuyển sang bảng nối course_lessons.
--  • Bài không gắn khoá nào = bài độc lập.
--  • Xoá khoá học chỉ gỡ bài khỏi khoá, KHÔNG xoá bài.
--  • lessons.lesson_number giữ làm số bài của chính bài học (dùng để sắp thứ tự trong mọi khoá).

create table if not exists course_lessons (
  course_id uuid not null references courses(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, lesson_id)
);
create index if not exists idx_course_lessons_lesson on course_lessons (lesson_id);
alter table course_lessons enable row level security;

-- Chuyển quan hệ cũ sang bảng nối, rồi bỏ cột course_id (kéo theo unique (course_id, lesson_number) và index của 008)
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'lessons' and column_name = 'course_id') then
    insert into course_lessons (course_id, lesson_id)
    select course_id, id from lessons where course_id is not null
    on conflict do nothing;
    drop index if exists idx_lessons_standalone_number;
    alter table lessons drop column course_id;
  end if;
end $$;

create index if not exists idx_lessons_number on lessons (lesson_number);
