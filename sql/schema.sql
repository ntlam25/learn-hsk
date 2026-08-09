-- Chạy toàn bộ file này trong Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Backend dùng SUPABASE_SERVICE_ROLE_KEY (bỏ qua RLS) nên không cần policy cho anon/
-- authenticated: chỉ backend Express mới đọc/ghi được các bảng này, frontend luôn đi
-- qua API của bạn chứ không gọi thẳng Supabase.

create extension if not exists pgcrypto; -- cho gen_random_uuid()

-- ============== users (admin / teacher / student) ==============
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  email text unique not null,
  password_hash text not null,
  full_name text default '',
  avatar_url text,
  role text not null default 'student' check (role in ('admin', 'teacher', 'student')),
  created_at timestamptz not null default now()
);

alter table users enable row level security;
-- Không tạo policy nào => mặc định deny hết với anon/authenticated key.
-- service_role key (dùng ở backend) luôn bypass RLS.

-- ============== courses (chia theo level chuẩn HSK) ==============
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  hsk_level text check (hsk_level in ('HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6')),
  created_by uuid references users(id) on delete set null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_courses_hsk_level on courses (hsk_level);
create index if not exists idx_courses_published on courses (published);

alter table courses enable row level security;

-- ============== lessons ==============
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  lesson_number integer not null,
  seal text default '',
  title_zh text default '',
  title_vi text not null,
  tag text default '',
  vocab jsonb not null default '[]'::jsonb,
  proper_nouns jsonb not null default '[]'::jsonb,
  dialogues jsonb not null default '[]'::jsonb,
  phonetics_notes jsonb not null default '[]'::jsonb,
  grammar jsonb not null default '[]'::jsonb,
  exercises jsonb not null default '{}'::jsonb,
  extra jsonb not null default '{}'::jsonb,
  source_pdf_url text,
  is_preview boolean not null default false,
  published boolean not null default true,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, lesson_number)
);

create index if not exists idx_lessons_course on lessons (course_id);
create index if not exists idx_lessons_published on lessons (published);
create index if not exists idx_lessons_preview on lessons (is_preview);

alter table lessons enable row level security;

-- ============== lesson_audio_tracks (file nghe theo từng khu vực: Từ mới/Bài khóa/Ngữ âm/Luyện tập) ==============
create table if not exists lesson_audio_tracks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  category text not null check (category in ('vocab', 'text', 'phonetics', 'practice')),
  label text not null default '',
  audio_url text not null,
  duration_sec numeric,
  code text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_lesson_audio_lesson on lesson_audio_tracks (lesson_id, category, sort_order);

alter table lesson_audio_tracks enable row level security;

-- ============== lesson_pages (ảnh trang sách gốc, xem dạng lightbox phóng to) ==============
create table if not exists lesson_pages (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  page_number integer not null default 1,
  image_url text not null,
  caption text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_lesson_pages_lesson on lesson_pages (lesson_id, page_number);

alter table lesson_pages enable row level security;

-- ============== exercise_items (bài tập có đáp án: quiz hoặc flashcard) ==============
create table if not exists exercise_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  kind text not null check (kind in ('quiz', 'flashcard')),
  type text not null default 'multiple_choice',
  prompt jsonb not null default '{}'::jsonb,
  correct_answer jsonb not null default '{}'::jsonb,
  points integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_exercise_items_lesson on exercise_items (lesson_id, kind, sort_order);

alter table exercise_items enable row level security;

-- ============== flashcard_reviews (học viên tự đánh giá thuộc/chưa thuộc) ==============
create table if not exists flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  exercise_item_id uuid not null references exercise_items(id) on delete cascade,
  student_id uuid not null references users(id) on delete cascade,
  status text not null check (status in ('known', 'unknown')),
  reviewed_at timestamptz not null default now(),
  unique (exercise_item_id, student_id)
);

alter table flashcard_reviews enable row level security;

-- ============== submissions (lượt làm quiz, có chấm điểm) ==============
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  exercise_item_id uuid not null references exercise_items(id) on delete cascade,
  student_id uuid not null references users(id) on delete cascade,
  answer jsonb not null default '{}'::jsonb,
  is_correct boolean not null default false,
  score integer not null default 0,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_submissions_student on submissions (student_id, exercise_item_id);

alter table submissions enable row level security;

-- ============== classes ==============
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  teacher_id uuid references users(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_classes_course on classes (course_id);
create index if not exists idx_classes_teacher on classes (teacher_id);

alter table classes enable row level security;

-- ============== enrollments (chỉ giáo viên/admin thêm học viên vào lớp) ==============
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references users(id) on delete cascade,
  enrolled_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create index if not exists idx_enrollments_student on enrollments (student_id);
create index if not exists idx_enrollments_class on enrollments (class_id);

alter table enrollments enable row level security;

-- ============== lesson_progress (tiến độ xem bài, dùng cho báo cáo giáo viên) ==============
create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  last_viewed_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create index if not exists idx_lesson_progress_student on lesson_progress (student_id);

alter table lesson_progress enable row level security;

-- ============== site_settings (mood giao diện — chỉ admin sửa được) ==============
create table if not exists site_settings (
  id integer primary key default 1,
  mood text not null default 'vui' check (mood in ('vui', 'buon', 'tap_trung', 'thu_gian')),
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 1)
);

insert into site_settings (id, mood) values (1, 'vui') on conflict (id) do nothing;

alter table site_settings enable row level security;

-- Tự động cập nhật updated_at mỗi khi UPDATE 1 dòng
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_courses_updated_at on courses;
create trigger trg_courses_updated_at
  before update on courses
  for each row execute function set_updated_at();

drop trigger if exists trg_lessons_updated_at on lessons;
create trigger trg_lessons_updated_at
  before update on lessons
  for each row execute function set_updated_at();

-- ============== Storage bucket cho ảnh/audio/pdf ==============
-- Cách 1 (khuyên dùng): vào Dashboard -> Storage -> New bucket
--   Tên: lesson-media, đánh dấu "Public bucket".
-- Cách 2: chạy đoạn dưới (cần quyền phù hợp, một số project phải tạo bucket qua Dashboard):
-- insert into storage.buckets (id, name, public)
-- values ('lesson-media', 'lesson-media', true)
-- on conflict (id) do nothing;
