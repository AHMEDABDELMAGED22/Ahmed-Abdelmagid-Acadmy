# Ahmed Academy Platform

Personal academy platform for Ahmed Abdelmegid, Software Engineer and Programming & Computer Science Instructor.

This is an independent project. It does not depend on the original Numeris AI codebase.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Storage, RLS
- Groq AI for curriculum-grounded exercise generation

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=your-groq-key
GROQ_MODEL=llama-3.3-70b-versatile
```

3. Run the migration in `supabase/migrations/001_academy_schema.sql`.

4. Create Ahmed's account through Supabase Auth, then manually set his profile role:

```sql
update public.profiles
set role = 'instructor'
where email = 'YOUR_INSTRUCTOR_EMAIL';
```

5. Run locally:

```bash
npm run dev
```
