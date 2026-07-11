-- Migration 003: Move lesson content text out of lessons table

CREATE TABLE IF NOT EXISTS public.lesson_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  content_text text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(lesson_id)
);

-- No data to migrate since content_text never existed in public.lessons

-- RLS
ALTER TABLE public.lesson_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "everyone can read lesson content" ON public.lesson_content
  FOR SELECT USING (true);

CREATE POLICY "instructors manage lesson content" ON public.lesson_content
  USING (public.is_instructor());
