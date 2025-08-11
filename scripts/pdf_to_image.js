#!/usr/bin/env node
/**
 * Convert PDF(s) under ./static to page images and emit a manifest.json
 *
 * Usage:
 *   node scripts/pdf_to_image.js                     # convert all PDFs under ./static
 *   node scripts/pdf_to_image.js --pdf static/foo.pdf  # convert a single PDF
 *   node scripts/pdf_to_image.js --dpi 200 --format jpg
 *
 * Output structure (for static/Hilfsmittel_12062024-2.pdf):
 *   static/pdf-images/Hilfsmittel_12062024-2/
 *     page-001.jpg, page-002.jpg, ...
 *     manifest.json  -> { pages: [{ url: "/pdf-images/Hilfsmittel_12062024-2/page-001.jpg" }, ...] }
 *
 * Requirements on dev machine: `pdftoppm` from Poppler (poppler-utils).
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const STATIC_DIR = path.join(ROOT, 'static');
const OUT_BASE = path.join(STATIC_DIR, 'pdf-images');

/** Simple CLI args parser */
function parseArgs(argv) {
  const out = { pdfs: [], dpi: 200, format: 'jpg' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pdf') { out.pdfs.push(argv[++i]); }
    else if (a === '--dpi') { out.dpi = parseInt(argv[++i] || '200', 10) || 200; }
    else if (a === '--format') {
      const f = (argv[++i] || 'jpg').toLowerCase();
      out.format = (f === 'png' ? 'png' : 'jpg');
    } else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/pdf_to_image.js [--pdf static/file.pdf] [--dpi 200] [--format jpg|png]');
      process.exit(0);
    } else {
      out.pdfs.push(a);
    }
  }
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function cleanOutDir(outDir) {
  if (!fs.existsSync(outDir)) return;
  const entries = fs.readdirSync(outDir);
  for (const f of entries) {
    if (/^page-\d+\.(jpg|png)$/i.test(f) || f === 'manifest.json') {
      try { fs.unlinkSync(path.join(outDir, f)); } catch {}
    }
  }
}

function findPdfsUnderStatic() {
  const found = [];
  function walk(dir) {
    const entries = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [];
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.pdf$/i.test(e.name)) found.push(p);
    }
  }
  walk(STATIC_DIR);
  return found;
}

function runPdftoppm(pdfPath, outPrefix, opts) {
  return new Promise((resolve, reject) => {
    const args = [];
    if (opts.format === 'png') args.push('-png'); else args.push('-jpeg', '-jpegopt', 'quality=85');
    args.push('-r', String(opts.dpi));
    // pdfPath, then output prefix (no extension)
    args.push(pdfPath, outPrefix);

    execFile('pdftoppm', args, { cwd: ROOT }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`pdftoppm failed for ${pdfPath}: ${stderr || err.message}`));
      resolve();
    });
  });
}

function zeroPad(n, width) {
  const s = String(n);
  if (s.length >= width) return s;
  return '0'.repeat(width - s.length) + s;
}

function collectAndRename(outDir, format) {
  const re = new RegExp(`^page-(\\d+)\\.${format}$`, 'i');
  const entries = fs.readdirSync(outDir).filter((f) => re.test(f));

  // Determine padding width from max index
  let maxIdx = 0;
  for (const f of entries) {
    const m = f.match(re);
    if (m) maxIdx = Math.max(maxIdx, parseInt(m[1], 10));
  }
  const pad = Math.max(3, String(maxIdx).length || 3);

  const renamed = [];
  for (const f of entries) {
    const m = f.match(re);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    const target = `page-${zeroPad(n, pad)}.${format}`;
    if (f !== target) {
      try {
        fs.renameSync(path.join(outDir, f), path.join(outDir, target));
      } catch {
        // On some platforms rename over existing may fail; fall back to unlink then rename
        try {
          fs.unlinkSync(path.join(outDir, target));
          fs.renameSync(path.join(outDir, f), path.join(outDir, target));
        } catch {}
      }
    }
    renamed.push(target);
  }

  // De-duplicate and sort numerically
  const uniq = Array.from(new Set(renamed))
    .filter((fname) => fs.existsSync(path.join(outDir, fname)))
    .sort((a, b) => {
      const na = parseInt(a.match(/(\d+)/)[1], 10);
      const nb = parseInt(b.match(/(\d+)/)[1], 10);
      return na - nb;
    });
  return uniq;
}

function writeManifest(outDir, publicBase, files) {
  const manifest = {
    pages: files.map((fname) => ({ url: path.posix.join(publicBase, fname) }))
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
}

async function convertOne(pdfAbs, opts) {
  const rel = path.relative(STATIC_DIR, pdfAbs);
  if (rel.startsWith('..')) {
    console.warn(`Skipping ${pdfAbs} (not under ./static)`);
    return;
  }
  const baseName = path.basename(pdfAbs).replace(/\.pdf$/i, '');
  const outDir = path.join(OUT_BASE, baseName);
  ensureDir(outDir);
  // Clean any previous output to avoid duplicate entries
  cleanOutDir(outDir);

  const outPrefix = path.join(outDir, 'page');
  console.log(`\n→ Converting: ${path.relative(ROOT, pdfAbs)}\n   Output: ${path.relative(ROOT, outDir)} (dpi=${opts.dpi}, format=${opts.format})`);
  await runPdftoppm(pdfAbs, outPrefix, opts);

  const files = collectAndRename(outDir, opts.format);
  const publicBase = `/pdf-images/${baseName}`;
  writeManifest(outDir, publicBase, files);
  console.log(`   Done: ${files.length} pages`);
}

async function main() {
  const args = parseArgs(process.argv);
  if (!fs.existsSync(STATIC_DIR)) {
    console.error('static/ directory not found. Run from project root.');
    process.exit(1);
  }
  if (!fs.existsSync(OUT_BASE)) ensureDir(OUT_BASE);

  let pdfs = args.pdfs.length ? args.pdfs : findPdfsUnderStatic();
  pdfs = pdfs.map((p) => path.isAbsolute(p) ? p : path.join(ROOT, p));
  pdfs = pdfs.filter((p) => fs.existsSync(p) && /\.pdf$/i.test(p));

  if (pdfs.length === 0) {
    console.log('No PDFs found. Place PDFs under ./static or pass with --pdf path/to/file.pdf');
    return;
  }

  for (const pdf of pdfs) {
    try {
      await convertOne(pdf, { dpi: args.dpi, format: args.format });
    } catch (e) {
      console.error(String(e));
      process.exitCode = 1;
    }
  }
}

const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((e) => { console.error(e); process.exit(1); });
}