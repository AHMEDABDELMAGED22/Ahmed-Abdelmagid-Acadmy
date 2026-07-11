-- Migration 005: Question Format Normalization
-- Enforce ONLY 'mcq' and 'true_false' formats as requested by user.

DO $$
BEGIN
    -- Only proceed if short_answer is still in the enum (meaning we haven't run this yet)
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'short_answer' AND enumtypid = 'public.question_kind'::regtype) THEN
        
        -- Delete any existing questions that don't match the new strict formats
        DELETE FROM public.questions WHERE kind::text NOT IN ('mcq', 'true_false');

        -- Rename old type
        ALTER TYPE public.question_kind RENAME TO question_kind_old;
        
        -- Create new strict type
        CREATE TYPE public.question_kind AS ENUM('mcq', 'true_false');
        
        -- Migrate table column to new type
        ALTER TABLE public.questions 
        ALTER COLUMN kind TYPE public.question_kind 
        USING kind::text::public.question_kind;
        
        -- Drop old type
        DROP TYPE public.question_kind_old;
    END IF;
END
$$;
