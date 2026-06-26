/* eslint-disable @typescript-eslint/no-explicit-any */
import Groq from "groq-sdk";
import type {
  ContentLanguage,
  GenerateExerciseRequest,
  GeneratedOption,
  GeneratedQuestion,
  QuestionKind,
} from "@/lib/types";
import { hasArabic, hasLatin, normalizeText } from "@/lib/utils";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const OPTION_LABELS = ["A", "B", "C", "D"];

function client() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured.");
  return new Groq({ apiKey });
}

function languageRules(language: ContentLanguage) {
  if (language === "arabic") {
    return `STRICT ARABIC MODE:
- Every visible field must be Arabic only: prompt, options, correct_answer, explanation, source_excerpt.
- Do not include English duplicate text, English labels in prose, transliteration, markdown, bullet symbols, or mixed-language explanations.
- Use clear Modern Standard Arabic suitable for secondary students.
- Numeric digits are allowed only when the curriculum requires numbers; do not mix English prose around them.`;
  }

  return `STRICT ENGLISH MODE:
- Every visible field must be English only.
- Do not include Arabic translation or duplicated bilingual text.
- Do not use markdown.`;
}

function expectedKinds(counts: GenerateExerciseRequest["counts"]): QuestionKind[] {
  return [
    ...Array.from({ length: counts.mcq }, () => "mcq" as const),
    ...Array.from({ length: counts.true_false }, () => "true_false" as const),
    ...Array.from({ length: counts.short_answer }, () => "short_answer" as const),
    ...Array.from({ length: counts.practical }, () => "practical" as const),
  ];
}

function schemaFor(kind: QuestionKind) {
  const options =
    kind === "mcq"
      ? `,
      "options": [
        { "label": "A", "text": "plausible option", "is_correct": false },
        { "label": "B", "text": "plausible option", "is_correct": true },
        { "label": "C", "text": "plausible option", "is_correct": false },
        { "label": "D", "text": "plausible option", "is_correct": false }
      ]`
      : "";

  return `{
      "kind": "${kind}",
      "prompt": "scenario or question based only on the lesson content"${options},
      "correct_answer": "${kind === "true_false" ? "true or false" : "correct answer"}",
      "explanation": "why the answer is correct",
      "source_excerpt": "short exact idea from the lesson context, not a long quote"
    }`;
}

function cleanOption(option: any, index: number): GeneratedOption {
  return {
    label: normalizeText(option?.label) || OPTION_LABELS[index] || String(index + 1),
    text: normalizeText(option?.text || option?.option_text),
    is_correct: Boolean(option?.is_correct),
  };
}

function cleanQuestion(raw: any, fallbackKind: QuestionKind): GeneratedQuestion {
  const kind = ["mcq", "true_false", "short_answer", "practical"].includes(raw?.kind)
    ? raw.kind
    : fallbackKind;

  return {
    kind,
    prompt: normalizeText(raw?.prompt || raw?.question),
    options: kind === "mcq" && Array.isArray(raw?.options)
      ? raw.options.map(cleanOption)
      : undefined,
    correct_answer: normalizeText(raw?.correct_answer),
    explanation: normalizeText(raw?.explanation),
    source_excerpt: normalizeText(raw?.source_excerpt),
  };
}

function textFields(question: GeneratedQuestion) {
  return [
    question.prompt,
    question.correct_answer,
    question.explanation,
    question.source_excerpt,
    ...(question.options || []).map((option) => option.text),
  ].filter(Boolean);
}

function similarityKey(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSimilarity(a: string, b: string) {
  const left = new Set(a.split(" ").filter(Boolean));
  const right = new Set(b.split(" ").filter(Boolean));
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap++;
  }
  return overlap / Math.max(left.size, right.size);
}

export function validateGeneratedQuestions(
  questions: GeneratedQuestion[],
  language: ContentLanguage,
  expected: QuestionKind[]
) {
  const errors: string[] = [];

  if (questions.length !== expected.length) {
    errors.push(`Expected ${expected.length} questions, got ${questions.length}.`);
  }

  const seen: string[] = [];
  questions.forEach((question, index) => {
    const prefix = `Question ${index + 1}`;
    if (question.kind !== expected[index]) errors.push(`${prefix}: expected ${expected[index]}, got ${question.kind}.`);
    if (!question.prompt) errors.push(`${prefix}: prompt is missing.`);
    if (!question.correct_answer) errors.push(`${prefix}: correct_answer is missing.`);
    if (!question.explanation) errors.push(`${prefix}: explanation is missing.`);
    if (!question.source_excerpt) errors.push(`${prefix}: source_excerpt is missing.`);

    if (/^what is\b/i.test(question.prompt) || /^define\b/i.test(question.prompt)) {
      errors.push(`${prefix}: avoid simple definition-only questions.`);
    }

    if (question.kind === "mcq") {
      if (!question.options || question.options.length !== 4) errors.push(`${prefix}: MCQ must have exactly 4 options.`);
      const correctCount = question.options?.filter((option) => option.is_correct).length || 0;
      if (correctCount !== 1) errors.push(`${prefix}: MCQ must have exactly one correct option.`);
      if (!OPTION_LABELS.every((label) => question.options?.some((option) => option.label === label))) {
        errors.push(`${prefix}: MCQ options must use labels A, B, C, D.`);
      }
    }

    if (question.kind === "true_false") {
      const answer = question.correct_answer.toLowerCase();
      if (!["true", "false", "صح", "خطأ"].includes(answer)) {
        errors.push(`${prefix}: true_false answer must be true/false or صح/خطأ.`);
      }
    }

    for (const field of textFields(question)) {
      if (field.includes("```") || field.includes("**") || field.includes("#")) {
        errors.push(`${prefix}: markdown artifact detected.`);
      }
      if (language === "arabic") {
        if (hasLatin(field)) errors.push(`${prefix}: English letters detected in Arabic mode.`);
        if (!hasArabic(field)) errors.push(`${prefix}: Arabic field has no Arabic text.`);
      }
      if (language === "english" && hasArabic(field)) {
        errors.push(`${prefix}: Arabic text detected in English mode.`);
      }
    }

    const key = similarityKey(question.prompt);
    if (seen.some((existing) => tokenSimilarity(existing, key) > 0.75)) {
      errors.push(`${prefix}: question is too similar to another generated question.`);
    }
    seen.push(key);
  });

  return errors;
}

export async function generateExerciseQuestions(request: GenerateExerciseRequest) {
  if (request.lessonContext.trim().length < 500) {
    throw new Error("Lesson context is required. Extract or paste the lesson content from the PDF first.");
  }

  const kinds = expectedKinds(request.counts);
  const total = kinds.length;
  if (total === 0) throw new Error("Question count must be greater than zero.");

  const system = `You are an expert ICT and computer science instructor creating real secondary-school exercises.
${languageRules(request.language)}

QUALITY RULES:
- Use ONLY the provided lesson context. Do not add outside facts.
- Test understanding, application, comparison, decision-making, and practical thinking.
- Avoid repeated questions, copied sentence prompts, and definition-only questions.
- MCQ distractors must be plausible and based on common misunderstandings.
- Practical questions should ask students to reason about a realistic technology situation.
- Return only valid JSON.

Return this exact JSON shape:
{
  "questions": [
    ${kinds.map(schemaFor).join(",\n")}
  ]
}`;

  const completion = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.45,
    max_tokens: 7000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `Create ${total} questions from this lesson context only:\n\n${request.lessonContext.slice(0, 12000)}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("AI returned no content.");

  const parsed = JSON.parse(content);
  const rawQuestions = Array.isArray(parsed?.questions) ? parsed.questions : [];
  const questions = kinds.map((kind, index) => cleanQuestion(rawQuestions[index] || {}, kind));
  const validationErrors = validateGeneratedQuestions(questions, request.language, kinds);
  if (validationErrors.length) {
    throw new Error(validationErrors.join(" "));
  }

  return questions;
}
