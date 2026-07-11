const fs = require('fs');

const lines = fs.readFileSync('decoded-pdf.txt', 'utf8').split('\n');
let chapters = [];
let currentChapter = null;

const chapterRegex = /^Chapter\s+(\d+)\s+(.+)$/;
const lessonRegex = /^(\d+-\d+)\s+(.+?)\s+(\d+)$/;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  // Strip out multiple spaces for easier matching
  let cleanLine = line.replace(/\s+/g, ' ').replace(/\u00A0/g, ' ');

  let chMatch = cleanLine.match(chapterRegex);
  if (chMatch) {
    currentChapter = { number: parseInt(chMatch[1]), title: chMatch[2].trim(), lessons: [] };
    chapters.push(currentChapter);
    continue;
  }

  let lessMatch = cleanLine.match(lessonRegex);
  if (lessMatch && currentChapter) {
    currentChapter.lessons.push({
      code: lessMatch[1],
      title: lessMatch[2].trim(),
      page: parseInt(lessMatch[3])
    });
  }

  // Stop after TOC (we see Answer Key at the end of TOC)
  if (cleanLine.includes('Answer Key (1)-(16)')) {
    break;
  }
}

fs.writeFileSync('toc.json', JSON.stringify(chapters, null, 2));
console.log('TOC extracted. Found', chapters.length, 'chapters.');
