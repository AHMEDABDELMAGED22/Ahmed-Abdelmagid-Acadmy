-- Migration 006: Try Practice exercise kind for interactive Try activities

ALTER TYPE public.exercise_kind ADD VALUE IF NOT EXISTS 'try_practice';

ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercise_scope;
ALTER TABLE public.exercises ADD CONSTRAINT exercise_scope CHECK (
  (kind IN ('lesson_practice', 'try_practice') AND lesson_id IS NOT NULL) OR
  (kind IN ('chapter_exam', 'custom_exam') AND chapter_id IS NOT NULL)
);
