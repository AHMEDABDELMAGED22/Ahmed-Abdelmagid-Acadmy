export type UserRole = "student" | "instructor";
export type CourseStatus = "draft" | "published" | "archived";
export type VideoProvider = "youtube" | "vimeo" | "bunny" | "mux";
export type VideoType = "explanation" | "try_solution" | "exercise_solution";
export type ExerciseStatus = "draft" | "published";
export type ExerciseKind = "lesson_practice" | "try_practice" | "chapter_exam" | "custom_exam";
export type QuestionKind = "mcq" | "true_false";
export type LearningStatus = "locked" | "unlocked" | "in_progress" | "completed";
export type ContentLanguage = "english" | "arabic";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstructorProfile {
  id: string;
  profile_id: string | null;
  display_name: string;
  title: string;
  subtitle: string;
  bio: string;
  avatar_url: string;
  created_at: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  status: CourseStatus;
  pass_score: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  course_id: string;
  chapter_number: number;
  title: string;
  source_page_start: number | null;
  source_page_end: number | null;
  order_index: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  chapter_id: string;
  lesson_code: string;
  title: string;
  description: string | null;
  source_page_start: number | null;
  source_page_end: number | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonVideo {
  id: string;
  lesson_id: string;
  provider: VideoProvider;
  video_type: VideoType;
  original_url: string;
  provider_video_id: string | null;
  embed_url: string | null;
  title: string | null;
  duration_seconds: number | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
}

export interface Exercise {
  id: string;
  course_id: string;
  chapter_id: string | null;
  lesson_id: string | null;
  kind: ExerciseKind;
  title: string;
  description: string | null;
  language: ContentLanguage;
  pass_score: number;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  status: ExerciseStatus;
  order_index: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  exercise_id: string;
  kind: QuestionKind;
  prompt: string;
  correct_answer: string;
  explanation: string;
  source_excerpt: string | null;
  language: ContentLanguage;
  order_index: number;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  label: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface LessonProgress {
  id: string;
  student_id: string;
  course_id: string;
  chapter_id: string;
  lesson_id: string;
  status: LearningStatus;
  point_completed: boolean;
  try_completed: boolean;
  exercise_completed: boolean;
  exercise_passed: boolean;
  unlocked: boolean;
  best_score: number | null;
  unlocked_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface ExerciseAttempt {
  id: string;
  student_id: string;
  exercise_id: string;
  course_id: string;
  chapter_id: string | null;
  lesson_id: string | null;
  attempt_number: number;
  score: number;
  passed: boolean;
  started_at: string;
  submitted_at: string | null;
}

export interface GeneratedOption {
  label: string;
  text: string;
  is_correct: boolean;
}

export interface GeneratedQuestion {
  kind: QuestionKind;
  prompt: string;
  options?: GeneratedOption[];
  correct_answer: string;
  explanation: string;
  source_excerpt: string;
}

export interface GenerateExerciseRequest {
  lessonId?: string;
  chapterId?: string;
  kind: ExerciseKind;
  language: ContentLanguage;
  title?: string;
  lessonContext: string;
  counts: {
    mcq: number;
    true_false: number;
    short_answer: number;
    practical: number;
  };
}
