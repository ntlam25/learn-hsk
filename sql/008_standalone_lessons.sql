-- Chạy 1 lần trong Supabase SQL Editor (sau 007): bài học độc lập, chưa thuộc khoá nào.
--  • lessons.course_id được phép null (import / tạo bài trước, gắn vào khoá sau trong trình soạn bài).
--  • Số bài của các bài độc lập không trùng nhau (bài trong khoá vẫn dùng unique (course_id, lesson_number)).

alter table lessons alter column course_id drop not null;
create unique index if not exists idx_lessons_standalone_number on lessons (lesson_number) where course_id is null;
