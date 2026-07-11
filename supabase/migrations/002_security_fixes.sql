-- ============================================================
-- 002_security_fixes.sql
-- Security hardening: fix privilege escalation and progress bypass
-- ============================================================

-- PART 1: Profiles — prevent role column modification by students
drop policy if exists "profiles self update" on public.profiles;

create policy "profiles self update safe" on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- PART 2: lesson_progress — students can only read, server writes only
drop policy if exists "students manage own lesson progress" on public.lesson_progress;

create policy "students view own lesson progress" on public.lesson_progress
  for select
  using (student_id = auth.uid());

-- PART 3: chapter_progress — students can only read, server writes only
drop policy if exists "students manage own chapter progress" on public.chapter_progress;

create policy "students view own chapter progress" on public.chapter_progress
  for select
  using (student_id = auth.uid());

-- PART 4: course_progress — students can only read, server writes only
drop policy if exists "students manage own course progress" on public.course_progress;

create policy "students view own course progress" on public.course_progress
  for select
  using (student_id = auth.uid());

-- PART 5: Auto-enrollment and auto-unlock lesson 1
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_course_id uuid;
  v_lesson_1_id uuid;
  v_chapter_1_id uuid;
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student'),
    new.email,
    'student'
  );

  -- Get course ID
  select id into v_course_id
  from public.courses
  where slug = 'programming-ai-introduction-to-ict-first-year-secondary';

  if v_course_id is not null then
    insert into public.enrollments (student_id, course_id)
    values (new.id, v_course_id)
    on conflict do nothing;

    -- Unlock lesson 1 (order_index = 1)
    select id, chapter_id into v_lesson_1_id, v_chapter_1_id
    from public.lessons
    where course_id = v_course_id and order_index = 1
    limit 1;

    if v_lesson_1_id is not null then
      insert into public.lesson_progress (student_id, course_id, chapter_id, lesson_id, status, unlocked_at)
      values (new.id, v_course_id, v_chapter_1_id, v_lesson_1_id, 'unlocked', now())
      on conflict (student_id, lesson_id) do nothing;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;
