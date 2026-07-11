const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const serviceMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const { createClient } = require('@supabase/supabase-js');

// Check if we have service role key
const svcKey = serviceMatch ? serviceMatch[1].trim() : null;
const anonKey = keyMatch[1].trim();

console.log("Service role key available:", !!svcKey);
console.log("Using:", svcKey ? "service_role" : "anon");

// The issue: lessons table is empty but lesson_content has orphaned rows
// This means the seed script was run in SQL editor (bypassing RLS) but
// the lessons it referenced were from a different course/chapter.

// Let's check enrollments too
const supabase = createClient(urlMatch[1].trim(), svcKey || anonKey);

async function debug() {
  // Check enrollments
  console.log("\n=== ENROLLMENTS ===");
  const { data: enrollments } = await supabase.from('enrollments').select('*');
  console.log(JSON.stringify(enrollments, null, 2));

  // Check exercises
  console.log("\n=== EXERCISES ===");
  const { data: exercises } = await supabase.from('exercises').select('id, title, lesson_id, kind, status');
  console.log(JSON.stringify(exercises, null, 2));

  // Check questions
  console.log("\n=== QUESTIONS ===");
  const { data: questions } = await supabase.from('questions').select('id, exercise_id, kind, prompt');
  console.log(JSON.stringify(questions, null, 2));
}

debug();
