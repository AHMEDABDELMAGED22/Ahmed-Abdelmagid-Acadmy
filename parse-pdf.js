const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = "c:\\Users\\am221\\Documents\\Codex\\2026-06-26\\the-correct-existing-project-location-is\\work\\كتاب اولى ثانوي لغات.pdf";

let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('c:\\Users\\am221\\.gemini\\antigravity-ide\\brain\\dd09d19b-694b-4eec-9cae-bfdb6fa0f8cf\\scratch\\pdf-content.txt', data.text);
    console.log("PDF parsed successfully. Number of pages:", data.numpages);
}).catch(err => {
    console.error("Error parsing PDF:", err);
});
