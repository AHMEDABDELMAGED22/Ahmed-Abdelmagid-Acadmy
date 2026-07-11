const fs = require('fs');

const lines = fs.readFileSync('decoded-pdf.txt', 'utf8').split('\n');

let course = {
  chapters: []
};

let currentChapter = null;
let currentLesson = null;
let currentSection = null; // 'point', 'try', 'exercise'
let currentSectionText = [];

const CHAPTER_REGEX = /^Chapter\s+(\d+)\s+(.+)$/;
const LESSON_REGEX = /^(\d+)-(\d+)\s+(.+)$/;

function finalizeSection() {
  if (currentLesson && currentSection && currentSectionText.length > 0) {
    currentLesson[currentSection] = currentSectionText.join('\n').trim();
    currentSectionText = [];
  }
}

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  if (!line) continue;

  // Cleanup PDF artifacts
  if (line.includes('--- PAGE BREAK ---')) continue;
  if (line.includes('2025/09/11')) continue; // date artifact
  if (line.includes('indb')) continue; // indesign artifact

  const chapterMatch = line.match(CHAPTER_REGEX);
  if (chapterMatch) {
    finalizeSection();
    currentChapter = {
      number: parseInt(chapterMatch[1], 10),
      title: chapterMatch[2],
      lessons: []
    };
    course.chapters.push(currentChapter);
    continue;
  }

  // Sometimes lesson titles are embedded in TOC or other places. We only want lessons inside a chapter.
  if (currentChapter) {
    const lessonMatch = line.match(LESSON_REGEX);
    // Be careful, some lines might start with "1-1" but aren't lessons. 
    // We assume if it has "Point! X-Y" it's the start of the lesson point.
    if (line.includes('Point!') && line.match(/Point!\s*(\d+-\d+)/)) {
      finalizeSection();
      const m = line.match(/Point!\s*(\d+-\d+)\s+(.+)/);
      if (m) {
        currentLesson = {
          code: m[1],
          title: m[2],
          point: "",
          try: "",
          exercise: ""
        };
        currentChapter.lessons.push(currentLesson);
        currentSection = 'point';
        continue;
      }
    }

    if (line === 'Try' || line.startsWith('Try 1') || line.startsWith('Try 2')) {
      finalizeSection();
      currentSection = 'try';
      continue;
    }

    if (line === 'Exercise' || line.startsWith('Exercise 1') || line.startsWith('Exercise 2')) {
      finalizeSection();
      currentSection = 'exercise';
      continue;
    }

    if (currentSection) {
      currentSectionText.push(line);
    }
  }
}

finalizeSection();

fs.writeFileSync('course-structure.json', JSON.stringify(course, null, 2));
console.log(`Extracted ${course.chapters.length} chapters.`);
