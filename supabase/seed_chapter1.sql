-- CLEANUP AND RE-SEED: Chapter 1 Lesson 1-1
-- This script fixes all orphaned data and properly creates the lesson under the correct course.

-- Step 1: Remove orphaned lesson_content
DELETE FROM public.lesson_content WHERE lesson_id NOT IN (SELECT id FROM public.lessons);

-- Step 2: Remove duplicate course "Information Study"  
DELETE FROM public.courses WHERE slug = 'information-study';

-- Step 3: Remove duplicate Chapter 1 that was under the deleted course
-- (the ON DELETE CASCADE should handle this, but just in case)
DELETE FROM public.chapters WHERE course_id NOT IN (SELECT id FROM public.courses);

-- Step 4: Create proper lesson and content under the real course
DO $$
DECLARE
    v_course_id uuid;
    v_chapter_id uuid;
    v_lesson_id uuid;
    v_exercise_id uuid;
    v_q1_id uuid;
    v_q2_id uuid;
    v_q3_id uuid;
    v_q4_id uuid;
BEGIN
    -- Get the REAL course
    SELECT id INTO v_course_id FROM public.courses 
    WHERE title ILIKE '%Programming and Artificial Intelligence%' LIMIT 1;
    
    RAISE NOTICE 'Course ID: %', v_course_id;

    IF v_course_id IS NULL THEN
        RAISE EXCEPTION 'Course not found! Cannot proceed.';
    END IF;

    -- Get or create Chapter 1 under the real course
    SELECT id INTO v_chapter_id FROM public.chapters 
    WHERE course_id = v_course_id AND chapter_number = 1 LIMIT 1;
    
    IF v_chapter_id IS NULL THEN
        INSERT INTO public.chapters (course_id, chapter_number, title, order_index)
        VALUES (v_course_id, 1, 'What is Information?', 1)
        RETURNING id INTO v_chapter_id;
    ELSE
        UPDATE public.chapters SET title = 'What is Information?' WHERE id = v_chapter_id;
    END IF;
    
    RAISE NOTICE 'Chapter ID: %', v_chapter_id;

    -- Create Lesson 1-1
    SELECT id INTO v_lesson_id FROM public.lessons 
    WHERE chapter_id = v_chapter_id AND lesson_code = '1-1' LIMIT 1;
    
    IF v_lesson_id IS NULL THEN
        INSERT INTO public.lessons (
            course_id, chapter_id, lesson_code, title, order_index, is_published,
            explanation_video_required, point_required, try_required, 
            try_video_required, exercise_required, exercise_video_required
        )
        VALUES (
            v_course_id, v_chapter_id, '1-1', 'Information and Media', 1, true,
            true, false, true, true, true, true
        )
        RETURNING id INTO v_lesson_id;
    ELSE
        UPDATE public.lessons SET
            explanation_video_required = true,
            point_required = false,
            try_required = true,
            try_video_required = true,
            exercise_required = true,
            exercise_video_required = true
        WHERE id = v_lesson_id;
    END IF;

    -- Insert Lesson Content (Point!, Try, Exercise)
    DELETE FROM public.lesson_content WHERE lesson_id = v_lesson_id;
    
    INSERT INTO public.lesson_content (lesson_id, point_content, try_content, exercise_content)
    VALUES (
        v_lesson_id,
        E'Information and Media Data, Information, Knowledge\n(1) ( 1 Data ) : Facts or matters represented using numbers, characters, or symbols.\n(2) ( 2 Information ) : Something that holds meaning or value for the recipient and serves as a basis for decision-making. Unlike objects, information has no form.\n• Information has the following characteristics.\n[1] ( 3 Persistence ) : Information, once created, cannot be completely erased.\n[2] ( 4 Reproducibility ) : Information can be easily copied in large quantities.\n[3] ( 5 Propagation ) : Information is easy to convey and spread.\n(3) ( 7 Knowledge ) : Information that has been analyzed and systematized to aid in problem-solving.',
        E'Answer the following questions.\n(1) What is the term for the representation of facts or matters using numbers, characters, or symbols?\n(2) For the following items a to c, answer whether they are related to: 1) Data, 2) Information, or 3) Knowledge.\na Results on mock exam\nb Analysis results for admission to the desired school\nc Scores on mock exam',
        E'Read the following passage and answer each question.\nWe obtain ( a ) such as weather forecasts from sources such as newspapers and television, and use it as a basis for deciding on our actions. Weather forecasts organize ( b ) such as weather conditions, precipitation, and atmospheric pressure patterns, and add meaning and value to them. Additionally, this can be generalized to accumulate ( c ), such as "it often rains in May and June every year."\n\n(1) Fill in the blanks with the appropriate words for ( a ) to ( c ).\n(2) For each of the following options A to C, use the corresponding letter to indicate which blank, ( a ) to ( c ), it is related to.\nA Temperature graph\nB Temperature\nC Analysis results of the lowest temperatures over the past 20 years'
    );

    -- Create Try Practice (interactive Try activity)
    DELETE FROM public.exercises WHERE lesson_id = v_lesson_id AND kind = 'try_practice';

    INSERT INTO public.exercises (course_id, chapter_id, lesson_id, kind, title, description, pass_score, status)
    VALUES (v_course_id, v_chapter_id, v_lesson_id, 'try_practice', 'Try 1-1', 'Interactive Try activity from textbook', 0, 'published')
    RETURNING id INTO v_exercise_id;

    -- Try Q1 (MCQ)
    INSERT INTO public.questions (exercise_id, kind, prompt, correct_answer, explanation, order_index)
    VALUES (v_exercise_id, 'mcq', 'What is the term for the representation of facts or matters using numbers, characters, or symbols?', 'Data', 'Data consists of raw facts represented using numbers, characters, or symbols before meaning is added.', 1)
    RETURNING id INTO v_q1_id;

    INSERT INTO public.question_options (question_id, label, option_text, is_correct, order_index) VALUES
    (v_q1_id, 'A', 'Data', true, 1),
    (v_q1_id, 'B', 'Information', false, 2),
    (v_q1_id, 'C', 'Knowledge', false, 3),
    (v_q1_id, 'D', 'Media', false, 4);

    -- Try Q2 (MCQ)
    INSERT INTO public.questions (exercise_id, kind, prompt, correct_answer, explanation, order_index)
    VALUES (v_exercise_id, 'mcq', 'Results on a mock exam are best classified as:', 'Data', 'Raw exam results are facts represented as numbers or scores — they are Data before analysis adds meaning.', 2)
    RETURNING id INTO v_q2_id;

    INSERT INTO public.question_options (question_id, label, option_text, is_correct, order_index) VALUES
    (v_q2_id, 'A', 'Data', true, 1),
    (v_q2_id, 'B', 'Information', false, 2),
    (v_q2_id, 'C', 'Knowledge', false, 3),
    (v_q2_id, 'D', 'Expression media', false, 4);

    -- Try Q3 (MCQ)
    INSERT INTO public.questions (exercise_id, kind, prompt, correct_answer, explanation, order_index)
    VALUES (v_exercise_id, 'mcq', 'Analysis results for admission to the desired school represent:', 'Knowledge', 'This is analyzed and systematized information used for decision-making — the definition of Knowledge.', 3)
    RETURNING id INTO v_q3_id;

    INSERT INTO public.question_options (question_id, label, option_text, is_correct, order_index) VALUES
    (v_q3_id, 'A', 'Data', false, 1),
    (v_q3_id, 'B', 'Information', false, 2),
    (v_q3_id, 'C', 'Knowledge', true, 3),
    (v_q3_id, 'D', 'Primary information', false, 4);

    -- Try Q4 (True/False)
    INSERT INTO public.questions (exercise_id, kind, prompt, correct_answer, explanation, order_index)
    VALUES (v_exercise_id, 'true_false', 'Scores on a mock exam are an example of Information because they help students make decisions.', 'False', 'Scores alone are raw Data. They become Information only when organized and given meaning for decision-making.', 4)
    RETURNING id INTO v_q4_id;

    -- Create Lesson Practice Exercise
    DELETE FROM public.exercises WHERE lesson_id = v_lesson_id AND kind = 'lesson_practice';
    
    INSERT INTO public.exercises (course_id, chapter_id, lesson_id, kind, title, description, pass_score, status)
    VALUES (v_course_id, v_chapter_id, v_lesson_id, 'lesson_practice', 'Exercise 1-1', 'Textbook exercise for Information and Media', 70, 'published')
    RETURNING id INTO v_exercise_id;
    
    RAISE NOTICE 'Exercise ID: %', v_exercise_id;

    -- Q1 (MCQ)
    INSERT INTO public.questions (exercise_id, kind, prompt, correct_answer, explanation, order_index)
    VALUES (v_exercise_id, 'mcq', 'When we obtain weather forecasts from sources like newspapers and television to use as a basis for deciding our actions, what does the weather forecast represent?', 'Information', 'A weather forecast organizes data and adds meaning/value to it to help in decision-making, which is the definition of information.', 1)
    RETURNING id INTO v_q1_id;

    INSERT INTO public.question_options (question_id, label, option_text, is_correct, order_index) VALUES 
    (v_q1_id, 'A', 'Data', false, 1),
    (v_q1_id, 'B', 'Information', true, 2),
    (v_q1_id, 'C', 'Knowledge', false, 3),
    (v_q1_id, 'D', 'Expression media', false, 4);

    -- Q2 (MCQ)
    INSERT INTO public.questions (exercise_id, kind, prompt, correct_answer, explanation, order_index)
    VALUES (v_exercise_id, 'mcq', 'Which of the following best represents ''Data'' in the context of weather?', 'Raw temperature values', 'Raw temperature values are facts represented by numbers, which fits the definition of Data before it is organized into Information.', 2)
    RETURNING id INTO v_q2_id;

    INSERT INTO public.question_options (question_id, label, option_text, is_correct, order_index) VALUES 
    (v_q2_id, 'A', 'A weather forecast on TV', false, 1),
    (v_q2_id, 'B', 'A temperature graph', false, 2),
    (v_q2_id, 'C', 'Raw temperature values', true, 3),
    (v_q2_id, 'D', 'An analysis of the lowest temperatures over the past 20 years', false, 4);

    -- Q3 (MCQ)
    INSERT INTO public.questions (exercise_id, kind, prompt, correct_answer, explanation, order_index)
    VALUES (v_exercise_id, 'mcq', 'Accumulating generalizations such as ''it often rains in May and June every year'' is an example of what?', 'Knowledge', 'Knowledge is information that has been analyzed and systematized to aid in problem-solving over time.', 3)
    RETURNING id INTO v_q3_id;

    INSERT INTO public.question_options (question_id, label, option_text, is_correct, order_index) VALUES 
    (v_q3_id, 'A', 'Data', false, 1),
    (v_q3_id, 'B', 'Information', false, 2),
    (v_q3_id, 'C', 'Knowledge', true, 3),
    (v_q3_id, 'D', 'Primary Information', false, 4);

    -- Q4 (True/False)
    INSERT INTO public.questions (exercise_id, kind, prompt, correct_answer, explanation, order_index)
    VALUES (v_exercise_id, 'true_false', 'An analysis of the lowest temperatures over the past 20 years is considered raw Data.', 'False', 'It is considered Knowledge because it is information that has been analyzed and systematized over a long period.', 4)
    RETURNING id INTO v_q4_id;

    INSERT INTO public.question_options (question_id, label, option_text, is_correct, order_index) VALUES 
    (v_q4_id, 'A', 'True', false, 1),
    (v_q4_id, 'B', 'False', true, 2);

    RAISE NOTICE 'Seed complete! Lesson %, Chapter %, Course %', v_lesson_id, v_chapter_id, v_course_id;
END $$;
