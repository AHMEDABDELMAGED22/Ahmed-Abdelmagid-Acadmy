-- Ahmed Academy Platform - independent schema
-- Run in Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create type public.user_role as enum ('student', 'instructor');
create type public.course_status as enum ('draft', 'published', 'archived');
create type public.video_provider as enum ('youtube', 'vimeo', 'bunny', 'mux');
create type public.exercise_status as enum ('draft', 'published');
create type public.exercise_kind as enum ('lesson_practice', 'chapter_exam');
create type public.question_kind as enum ('mcq', 'true_false', 'short_answer', 'practical');
create type public.learning_status as enum ('locked', 'unlocked', 'in_progress', 'completed');
create type public.generation_status as enum ('queued', 'running', 'draft_ready', 'failed', 'published');
create type public.content_language as enum ('english', 'arabic');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.user_role not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.instructor_profile (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null default 'Ahmed Abdelmegid',
  title text not null default 'Software Engineer',
  subtitle text not null default 'Programming & Computer Science Instructor',
  bio text not null default 'A personal technology academy focused on programming, computer science, ICT, and applied artificial intelligence.',
  avatar_url text not null default '/images/ahmed-abdelmegid.jpg',
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  status public.course_status not null default 'draft',
  pass_score numeric(5,2) not null default 70,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chapters (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  chapter_number integer not null,
  title text not null,
  source_page_start integer,
  source_page_end integer,
  order_index integer not null,
  created_at timestamptz not null default now(),
  unique(course_id, chapter_number)
);

create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  lesson_code text not null,
  title text not null,
  description text,
  source_page_start integer,
  source_page_end integer,
  order_index integer not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, lesson_code)
);

create table public.lesson_videos (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  provider public.video_provider not null default 'youtube',
  original_url text not null,
  provider_video_id text,
  embed_url text,
  title text,
  duration_seconds integer,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_resources (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  storage_path text not null,
  file_name text not null,
  content_type text,
  is_downloadable boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique(student_id, course_id)
);

create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  kind public.exercise_kind not null,
  title text not null,
  description text,
  language public.content_language not null default 'english',
  pass_score numeric(5,2) not null default 70,
  status public.exercise_status not null default 'draft',
  order_index integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_scope check (
    (kind = 'lesson_practice' and lesson_id is not null) or
    (kind = 'chapter_exam' and chapter_id is not null)
  )
);

create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  kind public.question_kind not null,
  prompt text not null,
  correct_answer text not null,
  explanation text not null,
  source_excerpt text,
  language public.content_language not null default 'english',
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.question_options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  option_text text not null,
  is_correct boolean not null default false,
  order_index integer not null default 0
);

create table public.lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status public.learning_status not null default 'locked',
  video_completed boolean not null default false,
  exercise_passed boolean not null default false,
  best_score numeric(5,2),
  unlocked_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(student_id, lesson_id)
);

create table public.exercise_attempts (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  attempt_number integer not null,
  score numeric(5,2) not null default 0,
  passed boolean not null default false,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  unique(student_id, exercise_id, attempt_number)
);

create table public.exercise_attempt_answers (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references public.exercise_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option_id uuid references public.question_options(id) on delete set null,
  answer_text text,
  is_correct boolean not null default false,
  feedback text,
  created_at timestamptz not null default now(),
  unique(attempt_id, question_id)
);

create table public.chapter_progress (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  lessons_completed integer not null default 0,
  lessons_total integer not null default 0,
  chapter_exam_passed boolean not null default false,
  progress_percentage numeric(5,2) not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(student_id, chapter_id)
);

create table public.course_progress (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lessons_completed integer not null default 0,
  lessons_total integer not null default 0,
  chapters_completed integer not null default 0,
  chapters_total integer not null default 0,
  average_score numeric(5,2) not null default 0,
  progress_percentage numeric(5,2) not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(student_id, course_id)
);

create table public.ai_generation_jobs (
  id uuid primary key default uuid_generate_v4(),
  exercise_id uuid references public.exercises(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  language public.content_language not null default 'english',
  status public.generation_status not null default 'queued',
  lesson_context text not null,
  request_payload jsonb not null default '{}',
  validation_errors jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_generation_history (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.ai_generation_jobs(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  input jsonb not null,
  output jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student'),
    new.email,
    'student'
  );

  insert into public.enrollments (student_id, course_id)
  select new.id, id
  from public.courses
  where slug = 'programming-ai-introduction-to-ict-first-year-secondary'
  on conflict do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_role()
returns public.user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function public.is_instructor()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'instructor'
  );
$$ language sql security definer stable;

create or replace function public.is_enrolled(course_uuid uuid)
returns boolean as $$
  select exists (
    select 1 from public.enrollments
    where student_id = auth.uid() and course_id = course_uuid
  );
$$ language sql security definer stable;

alter table public.profiles enable row level security;
alter table public.instructor_profile enable row level security;
alter table public.courses enable row level security;
alter table public.chapters enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_videos enable row level security;
alter table public.lesson_resources enable row level security;
alter table public.enrollments enable row level security;
alter table public.exercises enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.exercise_attempt_answers enable row level security;
alter table public.chapter_progress enable row level security;
alter table public.course_progress enable row level security;
alter table public.ai_generation_jobs enable row level security;
alter table public.ai_generation_history enable row level security;

create policy "profiles self read" on public.profiles for select using (id = auth.uid());
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "instructor reads profiles" on public.profiles for select using (public.is_instructor());

create policy "public instructor identity" on public.instructor_profile for select using (true);
create policy "instructor manages identity" on public.instructor_profile for all using (public.is_instructor()) with check (public.is_instructor());

create policy "public published courses" on public.courses for select using (status = 'published');
create policy "instructor manages courses" on public.courses for all using (public.is_instructor()) with check (public.is_instructor());

create policy "public published chapters" on public.chapters for select using (
  exists (select 1 from public.courses c where c.id = course_id and c.status = 'published')
);
create policy "instructor manages chapters" on public.chapters for all using (public.is_instructor()) with check (public.is_instructor());

create policy "students view enrolled lessons" on public.lessons for select using (
  is_published and public.is_enrolled(course_id)
);
create policy "instructor manages lessons" on public.lessons for all using (public.is_instructor()) with check (public.is_instructor());

create policy "students view lesson videos" on public.lesson_videos for select using (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_id and public.is_enrolled(l.course_id)
  )
);
create policy "instructor manages lesson videos" on public.lesson_videos for all using (public.is_instructor()) with check (public.is_instructor());

create policy "students view resources" on public.lesson_resources for select using (
  exists (
    select 1 from public.lessons l
    where l.id = lesson_id and public.is_enrolled(l.course_id)
  )
);
create policy "instructor manages resources" on public.lesson_resources for all using (public.is_instructor()) with check (public.is_instructor());

create policy "student reads own enrollments" on public.enrollments for select using (student_id = auth.uid());
create policy "instructor manages enrollments" on public.enrollments for all using (public.is_instructor()) with check (public.is_instructor());

create policy "students read published exercises" on public.exercises for select using (
  status = 'published' and public.is_enrolled(course_id)
);
create policy "instructor manages exercises" on public.exercises for all using (public.is_instructor()) with check (public.is_instructor());

create policy "students read published questions" on public.questions for select using (
  exists (
    select 1 from public.exercises e
    where e.id = exercise_id and e.status = 'published' and public.is_enrolled(e.course_id)
  )
);
create policy "instructor manages questions" on public.questions for all using (public.is_instructor()) with check (public.is_instructor());

create policy "students read published options" on public.question_options for select using (
  exists (
    select 1 from public.questions q
    join public.exercises e on e.id = q.exercise_id
    where q.id = question_id and e.status = 'published' and public.is_enrolled(e.course_id)
  )
);
create policy "instructor manages options" on public.question_options for all using (public.is_instructor()) with check (public.is_instructor());

create policy "students manage own lesson progress" on public.lesson_progress for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "instructor reads lesson progress" on public.lesson_progress for select using (public.is_instructor());

create policy "students manage own attempts" on public.exercise_attempts for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "instructor reads attempts" on public.exercise_attempts for select using (public.is_instructor());

create policy "students manage own attempt answers" on public.exercise_attempt_answers for all using (
  exists (select 1 from public.exercise_attempts a where a.id = attempt_id and a.student_id = auth.uid())
) with check (
  exists (select 1 from public.exercise_attempts a where a.id = attempt_id and a.student_id = auth.uid())
);
create policy "instructor reads attempt answers" on public.exercise_attempt_answers for select using (public.is_instructor());

create policy "students read own chapter progress" on public.chapter_progress for select using (student_id = auth.uid());
create policy "students manage own chapter progress" on public.chapter_progress for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "instructor reads chapter progress" on public.chapter_progress for select using (public.is_instructor());

create policy "students read own course progress" on public.course_progress for select using (student_id = auth.uid());
create policy "students manage own course progress" on public.course_progress for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "instructor reads course progress" on public.course_progress for select using (public.is_instructor());

create policy "instructor manages ai jobs" on public.ai_generation_jobs for all using (public.is_instructor()) with check (public.is_instructor());
create policy "instructor manages ai history" on public.ai_generation_history for all using (public.is_instructor()) with check (public.is_instructor());

insert into storage.buckets (id, name, public)
values ('academy-resources', 'academy-resources', false)
on conflict (id) do nothing;

create policy "instructor uploads academy resources" on storage.objects
  for insert with check (bucket_id = 'academy-resources' and public.is_instructor());
create policy "instructor manages academy resources" on storage.objects
  for all using (bucket_id = 'academy-resources' and public.is_instructor());
create policy "authenticated reads academy resources" on storage.objects
  for select using (bucket_id = 'academy-resources' and auth.role() = 'authenticated');

create index idx_chapters_course on public.chapters(course_id, order_index);
create index idx_lessons_course_order on public.lessons(course_id, order_index);
create index idx_lessons_chapter_order on public.lessons(chapter_id, order_index);
create index idx_enrollments_student on public.enrollments(student_id);
create index idx_exercises_lesson on public.exercises(lesson_id);
create index idx_questions_exercise on public.questions(exercise_id, order_index);
create index idx_lesson_progress_student on public.lesson_progress(student_id, course_id);
create index idx_attempts_student on public.exercise_attempts(student_id, exercise_id);

insert into public.instructor_profile (display_name, title, subtitle, bio, avatar_url)
values (
  'Ahmed Abdelmegid',
  'Software Engineer',
  'Programming & Computer Science Instructor',
  'Ahmed Abdelmegid teaches programming, computer science, ICT, and applied AI through a focused personal academy experience.',
  '/images/ahmed-abdelmegid.jpg'
);

insert into public.courses (slug, title, subtitle, description, status, order_index)
values (
  'programming-ai-introduction-to-ict-first-year-secondary',
  'Programming and Artificial Intelligence',
  'Introduction to ICT - First Year Secondary',
  'Official first-year secondary ICT course built from the uploaded curriculum book. Lessons are locked in sequence and paired with video, exercises, progress tracking, and chapter exams.',
  'published',
  1
);

with course_ref as (
  select id from public.courses where slug = 'programming-ai-introduction-to-ict-first-year-secondary'
),
inserted_chapters as (
  insert into public.chapters (course_id, chapter_number, title, source_page_start, source_page_end, order_index)
  select c.id, x.chapter_number, x.title, x.source_page_start, x.source_page_end, x.order_index
  from course_ref c
  cross join (values
    (1, 'What is Information?', 4, 11, 1),
    (2, 'Regulations and Rights in the Information Society', 12, 23, 2),
    (3, 'Information Security', 24, 41, 3),
    (4, 'Information Technology and Society', 42, 45, 4),
    (5, 'Communication', 46, 52, 5),
    (6, 'Information Design', 53, 84, 6),
    (7, 'Computers', 85, 94, 7),
    (8, 'Networks', 95, 110, 8),
    (9, 'Databases', 111, 122, 9),
    (10, 'Data Analysis', 123, 141, 10),
    (11, 'Simulations', 142, 154, 11),
    (12, 'Programming (Python)', 155, 175, 12)
  ) as x(chapter_number, title, source_page_start, source_page_end, order_index)
  returning id, course_id, chapter_number
)
insert into public.lessons (course_id, chapter_id, lesson_code, title, source_page_start, source_page_end, order_index)
select ch.course_id, ch.id, l.lesson_code, l.title, l.source_page_start, l.source_page_end, l.order_index
from inserted_chapters ch
join (values
  (1, '1-1', 'Information and Media', 4, 7, 1),
  (1, '1-2', 'Information Ethics', 8, 11, 2),
  (2, '2-1', 'Personal Information', 12, 15, 3),
  (2, '2-2', 'Intellectual Property Rights', 16, 19, 4),
  (2, '2-3', 'Utilization and Disclosure of Information', 20, 23, 5),
  (3, '3-1', 'Threats and Countermeasures in Information Security [1]', 24, 27, 6),
  (3, '3-2', 'Threats and Countermeasures in Information Security [2]', 28, 31, 7),
  (3, '3-3', 'Threats and Countermeasures in Information Security [3]', 32, 34, 8),
  (3, '3-4', 'Information Technology for Safety [1]', 35, 37, 9),
  (3, '3-5', 'Information Technology for Safety [2]', 38, 41, 10),
  (4, '4-1', 'Development of Information Technology', 42, 45, 11),
  (5, '5-1', 'Development of Communication Methods', 46, 47, 12),
  (5, '5-2', 'Communication and Its Forms', 48, 49, 13),
  (5, '5-3', 'Internet and Communication', 50, 52, 14),
  (6, '6-1', 'Analog and Digital', 53, 54, 15),
  (6, '6-2', 'Binary and Amount of Information', 55, 58, 16),
  (6, '6-3', 'Hexadecimal', 59, 60, 17),
  (6, '6-4', 'Digital Representation of Characters', 61, 64, 18),
  (6, '6-5', 'Numerical Calculations [1]', 65, 66, 19),
  (6, '6-6', 'Numerical Calculations [2]', 67, 68, 20),
  (6, '6-7', 'Digitalization of Sound', 69, 72, 21),
  (6, '6-8', 'Digitization of Images', 73, 76, 22),
  (6, '6-9', 'Digital Representation and Compression Technology for Videos', 77, 80, 23),
  (6, '6-10', 'Information Design', 81, 84, 24),
  (7, '7-1', 'Computer Configuration', 85, 88, 25),
  (7, '7-2', 'Computer Software', 89, 90, 26),
  (7, '7-3', 'Logic Circuits', 91, 94, 27),
  (8, '8-1', 'Computer Networks', 95, 98, 28),
  (8, '8-2', 'IP Addresses and Domain Names', 99, 100, 29),
  (8, '8-3', 'Communication Protocol', 101, 104, 30),
  (8, '8-4', 'Mechanism of Web Pages and Emails', 105, 108, 31),
  (8, '8-5', 'Network Transfer Speed', 109, 110, 32),
  (9, '9-1', 'Database [1]', 111, 114, 33),
  (9, '9-2', 'Database [2]', 115, 118, 34),
  (9, '9-3', 'Various Information Systems', 119, 122, 35),
  (10, '10-1', 'Types of Data and Analysis', 123, 126, 36),
  (10, '10-2', 'Data Analysis [1]', 127, 130, 37),
  (10, '10-3', 'Data Analysis [2]', 131, 133, 38),
  (10, '10-4', 'Data Analysis [3]', 134, 135, 39),
  (10, '10-5', 'Data Analysis [4]', 136, 139, 40),
  (10, '10-6', 'Data Analysis [5]', 140, 141, 41),
  (11, '11-1', 'Modeling', 142, 144, 42),
  (11, '11-2', 'Simulations [1]', 145, 148, 43),
  (11, '11-3', 'Simulations [2]', 149, 152, 44),
  (11, '11-4', 'Queues', 153, 154, 45),
  (12, '12-1', 'Algorithm', 155, 158, 46),
  (12, '12-2', 'Programming Basics [1] (Python)', 159, 162, 47),
  (12, '12-3', 'Programming Basics [2] (Python)', 163, 167, 48),
  (12, '12-4', 'Application of Programming [1] (Python)', 168, 171, 49),
  (12, '12-5', 'Application of Programming [2] (Python)', 172, 175, 50)
) as l(chapter_number, lesson_code, title, source_page_start, source_page_end, order_index)
on l.chapter_number = ch.chapter_number;
