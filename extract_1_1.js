const fs = require('fs');

const lines = fs.readFileSync('decoded-pdf.txt', 'utf8').split('\n');
let p11Start = -1;
let p11End = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Point! 1-1')) {
    p11Start = i;
  }
  if (lines[i].includes('Point! 1-2')) {
    p11End = i;
    break;
  }
}

if (p11Start !== -1 && p11End !== -1) {
  const content = lines.slice(p11Start, p11End).join('\n');
  fs.writeFileSync('lesson1_1.txt', content);
  console.log("Extracted 1-1.");
} else {
  console.log("Could not find 1-1 or 1-2 bounds.");
}
