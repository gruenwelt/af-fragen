import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse, stringify } from 'svgson';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const inputDir = path.join(projectRoot, 'src', 'lib', 'images', 'svgs');
const outputDir = path.join(projectRoot, 'static', 'svgs-2x');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.readdirSync(inputDir).forEach(async (file) => {
  if (path.extname(file) === '.svg') {
    const filePath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);
    const svgContent = fs.readFileSync(filePath, 'utf8');
    const parsed = await parse(svgContent);

    if (!parsed.attributes.viewBox) {
      const width = parseFloat(parsed.attributes.width || '0');
      const height = parseFloat(parsed.attributes.height || '0');
      if (width && height) {
        parsed.attributes.viewBox = `0 0 ${width} ${height}`;
      } else {
        console.warn(`Skipping ${file}: missing viewBox and width/height`);
        return;
      }
    }

    if (parsed.attributes.viewBox) {
      const viewBox = parsed.attributes.viewBox.split(' ').map(Number);
      viewBox[2] *= 2;
      viewBox[3] *= 2;
      parsed.attributes.viewBox = viewBox.join(' ');
      parsed.attributes.width = viewBox[2].toString();
      parsed.attributes.height = viewBox[3].toString();
    }

    // Wrap original children in a <g transform="scale(2)"> element
    parsed.children = [
      {
        name: 'g',
        type: 'element',
        value: '',
        attributes: { transform: 'scale(2)' },
        children: parsed.children
      }
    ];

    const scaledSVG = stringify(parsed);
    fs.writeFileSync(outputPath, scaledSVG, 'utf8');
    console.log(`Scaled ${file} -> ${outputPath}`);
  }
});