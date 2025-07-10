import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = process.argv[2];
const outputPath = process.argv[3] || 'github-logo-inverted.svg';

if (!inputPath) {
  console.error('Usage: node invert-github-logo.js path/to/input.svg [output.svg]');
  process.exit(1);
}

let svg = fs.readFileSync(path.resolve(__dirname, inputPath), 'utf-8');

// Replace common black fills/strokes with white
svg = svg
  .replace(/fill="#000000"/gi, 'fill="#ffffff"')
  .replace(/fill="#000"/gi, 'fill="#ffffff"')
  .replace(/fill: *#000000/gi, 'fill:#ffffff')
  .replace(/fill: *#000/gi, 'fill:#ffffff')
  .replace(/stroke="#000000"/gi, 'stroke="#ffffff"')
  .replace(/stroke="#000"/gi, 'stroke="#ffffff');

svg = svg.replace('<svg', '<svg style="filter:invert(1)"');

fs.writeFileSync(path.resolve(__dirname, outputPath), svg, 'utf-8');
console.log(`✅ Inverted logo saved to: ${outputPath}`);
