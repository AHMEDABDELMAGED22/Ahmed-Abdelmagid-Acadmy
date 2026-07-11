const fs = require('fs');

const rawText = fs.readFileSync('lesson1_1.txt', 'utf8');

// The file contains pages 4, 5, 6, 7.
// We can use regex to split out the sections.
// Note: We've manually isolated the relevant pages. In full extraction, we'll slice by 'Point! X-Y'.

const lesson = {
  chapter: 1,
  chapter_title: "What is Information?",
  lesson_code: "1-1",
  lesson_title: "Information and Media",
  point_content: "",
  try_content: "",
  exercise_content: ""
};

// Extract Point
// Starts at "Point! 1-1" up to "Try 1"
let pointMatch = rawText.match(/Point!\s*1-1([\s\S]*?)Answer the following questions.*Try 1/);
if (pointMatch) {
  lesson.point_content = pointMatch[1]
    .replace(/スプリックス「情報」テキスト_英語版.indb\s+\d+\s+2025\/09\/11\s+11:27:\d+/g, '') // remove footer
    .replace(/--- PAGE BREAK ---/g, '')
    .trim();
}

// Extract Try
// Starts at "Try 1" up to "Exercise 1"
let tryMatch = rawText.match(/(Answer the following questions\.[\s\S]*?)Exercise 1/);
if (tryMatch) {
  lesson.try_content = tryMatch[1]
    .replace(/Try 1/, '') // remove marker
    .replace(/スプリックス「情報」テキスト_英語版.indb\s+\d+\s+2025\/09\/11\s+11:27:\d+/g, '') // remove footer
    .replace(/--- PAGE BREAK ---/g, '')
    .trim();
}

// Extract Exercise
// Starts at "Exercise 1" up to end
let exerciseMatch = rawText.match(/(Cover the section on page 1[\s\S]*)/);
if (exerciseMatch) {
  lesson.exercise_content = exerciseMatch[1]
    .replace(/Exercise 1 Point! 2 3/, '')
    .replace(/スプリックス「情報」テキスト_英語版.indb\s+\d+\s+2025\/09\/11\s+11:27:\d+/g, '') // remove footer
    .replace(/--- PAGE BREAK ---/g, '')
    .trim();
}

fs.writeFileSync('lesson1_1_extracted.json', JSON.stringify(lesson, null, 2));
console.log("Successfully extracted 1-1 structure.");
