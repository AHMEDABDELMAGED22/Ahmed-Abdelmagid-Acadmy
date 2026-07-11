# Project Progress

## What is completed
- Created Implementation Plan for the Platform Expansion (3-video system, content extraction, lock system).
- Wrote Database Migration script `004_platform_expansion.sql`.
- Updated `types.ts` to reflect the new database schema (`VideoType`, `point_viewed`, `try_completed`, etc.).
- Updated Instructor Dashboard Course editor (`src/app/instructor/courses/[id]/page.tsx`) to manage the 3 videos per lesson.
- Updated `actions.ts` to handle saving videos by `video_type`.
- Created PDF extraction script and extracted Chapter 1 content to a local scratch file (`lesson1_1.txt`).

## What files changed
- `src/lib/types.ts`
- `src/app/instructor/actions.ts`
- `src/app/instructor/courses/[id]/page.tsx`
- `supabase/migrations/004_platform_expansion.sql` (New)

## Current architecture
- The `lesson_videos` table now supports multiple videos per lesson using a composite unique key `(lesson_id, video_type)`.
- The `lesson_progress` tracks granular completion of `point_viewed`, `try_completed`, `exercise_passed`.

## Database status
- **PENDING MIGRATION**: The `004_platform_expansion.sql` needs to be applied to the remote Supabase project. I lack the service role key or password to push this remotely via CLI.

## Remaining tasks
- Extract the remaining content from `lesson1_1.txt` to seed the database with Lesson 1-1 structure.
- Update Student Lesson View (`src/app/student/lesson/[id]/page.tsx`) to implement the learning lock system (Point -> Try -> Exercise).
- Enhance the Instructor Dashboard to edit `point_content` and `try_content`.

## Next recommended step
1. User must apply `supabase/migrations/004_platform_expansion.sql` in their Supabase SQL editor.
2. Continue building the Student Lesson View to respect the new locks.
