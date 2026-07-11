-- Migration 004: Platform Expansion (Final Architecture: Relational Progress & 3-Video System)

DO $$ BEGIN
  CREATE TYPE public.video_type AS ENUM ('explanation', 'try_solution', 'exercise_solution');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Video Types & Schema
ALTER TABLE public.lesson_videos ADD COLUMN IF NOT EXISTS video_type public.video_type NOT NULL DEFAULT 'explanation';

-- Drop the old unique constraint on lesson_id and create a new one on (lesson_id, video_type)
ALTER TABLE public.lesson_videos DROP CONSTRAINT IF EXISTS lesson_videos_lesson_id_key;
-- Check if the constraint exists before adding to avoid errors on retry
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_videos_lesson_id_video_type_key') THEN
        ALTER TABLE public.lesson_videos ADD CONSTRAINT lesson_videos_lesson_id_video_type_key UNIQUE (lesson_id, video_type);
    END IF;
END $$;

-- 2. Lesson Structure & Configuration (Required/Optional)
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS explanation_video_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS point_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS try_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS try_video_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS exercise_required boolean NOT NULL DEFAULT true;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS exercise_video_required boolean NOT NULL DEFAULT false;

-- Lesson Content
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_content' AND column_name = 'content_text') THEN
        ALTER TABLE public.lesson_content RENAME COLUMN content_text TO point_content;
    END IF;
END $$;

ALTER TABLE public.lesson_content ALTER COLUMN point_content DROP NOT NULL;
ALTER TABLE public.lesson_content ADD COLUMN IF NOT EXISTS try_content text;
ALTER TABLE public.lesson_content ADD COLUMN IF NOT EXISTS exercise_content text;


-- 3. Relational Progress Tracking Updates
-- `course_progress`, `chapter_progress`, `lesson_progress` already exist from 001.

DO $$
BEGIN
    -- Rename columns in course_progress to match exact requirement
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_progress' AND column_name = 'lessons_completed') THEN
        ALTER TABLE public.course_progress RENAME COLUMN lessons_completed TO completed_count;
        ALTER TABLE public.course_progress RENAME COLUMN lessons_total TO total_lessons;
        ALTER TABLE public.course_progress RENAME COLUMN progress_percentage TO percentage;
    END IF;

    -- Rename columns in chapter_progress to match exact requirement
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chapter_progress' AND column_name = 'lessons_completed') THEN
        ALTER TABLE public.chapter_progress RENAME COLUMN lessons_completed TO completed_count;
        ALTER TABLE public.chapter_progress RENAME COLUMN lessons_total TO total_lessons;
        ALTER TABLE public.chapter_progress RENAME COLUMN progress_percentage TO percentage;
    END IF;
END $$;

-- Add status if they do not exist
ALTER TABLE public.course_progress ADD COLUMN IF NOT EXISTS status public.learning_status NOT NULL DEFAULT 'in_progress';
ALTER TABLE public.chapter_progress ADD COLUMN IF NOT EXISTS status public.learning_status NOT NULL DEFAULT 'in_progress';

-- Add new columns to lesson_progress exactly as requested
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS point_completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS try_completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS exercise_completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS unlocked boolean NOT NULL DEFAULT false;
-- lesson_progress already has exercise_passed, video_completed

-- Create video_completion for granular tracking
CREATE TABLE IF NOT EXISTS public.video_completion (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id uuid NOT NULL REFERENCES public.lesson_videos(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completion_percentage numeric(5,2) NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  last_watched_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(video_id, student_id)
);


-- 4. Exercises Settings
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS time_limit_minutes integer;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS max_attempts integer;


-- 5. Exam system distinction
ALTER TYPE public.exercise_kind ADD VALUE IF NOT EXISTS 'custom_exam';


-- Ensure RLS on new table
ALTER TABLE public.video_completion ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own video completion' AND tablename = 'video_completion') THEN
        CREATE POLICY "Users can manage their own video completion" ON public.video_completion FOR ALL USING (auth.uid() = student_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Instructors can read all video completion' AND tablename = 'video_completion') THEN
        CREATE POLICY "Instructors can read all video completion" ON public.video_completion FOR SELECT USING (public.is_instructor());
    END IF;
END $$;
