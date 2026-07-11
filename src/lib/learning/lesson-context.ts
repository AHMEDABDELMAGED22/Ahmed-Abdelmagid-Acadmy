export function buildLessonContext(parts: {
  title?: string | null;
  pointContent?: string | null;
  tryContent?: string | null;
  exerciseContent?: string | null;
}) {
  return [
    parts.title ? `LESSON TOPIC:\n${parts.title}` : null,
    parts.pointContent ? `POINT CONTENT:\n${parts.pointContent}` : null,
    parts.tryContent ? `TRY CONTENT:\n${parts.tryContent}` : null,
    parts.exerciseContent ? `EXERCISE CONTENT:\n${parts.exerciseContent}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function suggestedQuestionCounts(contextLength: number) {
  if (contextLength < 800) return { mcq: 4, true_false: 1 };
  if (contextLength < 1500) return { mcq: 5, true_false: 2 };
  if (contextLength < 2500) return { mcq: 6, true_false: 2 };
  return { mcq: 7, true_false: 3 };
}
