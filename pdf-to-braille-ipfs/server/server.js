import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

import Tesseract from 'tesseract.js';
import pdfPoppler from 'pdf-poppler';
import { fileURLToPath } from 'url';
import { toBraille } from './braille.js';
import { pinFile, pinJSON } from './pinata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use('/', express.static(path.join(__dirname, '..', 'web')));

// Multer → memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

// tmp dir
const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// 🔑 Extract text with OCR fallback
async function extractText(buffer, pdfPath) {
  try {
    const data = await pdf(buffer);
    if (data.text && data.text.trim()) {
      return data.text.trim();
    }
  } catch (err) {
    console.warn("⚠️ pdf-parse failed, will try OCR…", err.message);
  }

  console.log("⚠️ No text layer found, running OCR...");

  // convert 1st page to PNG
 await pdfPoppler.convert(pdfPath, {
  format: 'png',
  out_dir: TMP_DIR,
  out_prefix: 'page',
  page: 1,
  dpi: 150   // 👈 add this
});

  // pdf-poppler names the file page-1.png
  const outputImg = path.join(TMP_DIR, 'page-1.png');

  const { data: { text } } = await Tesseract.recognize(outputImg, 'eng');

  // cleanup PNG
  try { fs.unlinkSync(outputImg); } catch (_) {}

  return text.trim();
}

app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });

    const { title = 'Untitled', author = 'Unknown' } = req.body;

    // 1) Save original PDF temporarily
    const pdfName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
    const pdfPath = path.join(TMP_DIR, pdfName);
    fs.writeFileSync(pdfPath, req.file.buffer);

    // 2) Extract text
    const text = await extractText(req.file.buffer, pdfPath);
    if (!text) throw new Error('No readable text found even after OCR.');

    // 3) Convert to Braille
    const braille = toBraille(text);

    // 4) Save Braille files
    const baseName = pdfName.replace(/\.pdf$/i, '');
    const brailleTxtPath = path.join(TMP_DIR, `${baseName}.braille.txt`);
    fs.writeFileSync(brailleTxtPath, braille, 'utf8');

    const brailleBrfPath = path.join(TMP_DIR, `${baseName}.brf`);
    fs.writeFileSync(brailleBrfPath, braille, 'utf8');

    // 5) Pin to IPFS
    const pdfPin = await pinFile(pdfPath, { name: `${title}.pdf`, keyvalues: { kind: 'original-pdf', author, title } });
    const brailleTxtPin = await pinFile(brailleTxtPath, { name: `${title}.braille.txt`, keyvalues: { kind: 'braille-text', author, title } });
    const brailleBrfPin = await pinFile(brailleBrfPath, { name: `${title}.brf`, keyvalues: { kind: 'braille-brf', author, title } });

    // 6) Manifest JSON
    const manifest = {
      title,
      author,
      createdAt: new Date().toISOString(),
      originalPDF: { cid: pdfPin.IpfsHash },
      brailleTxt: { cid: brailleTxtPin.IpfsHash },
      brailleBrf: { cid: brailleBrfPin.IpfsHash },
      note: 'Braille generated from extracted text using Unicode Braille patterns. OCR applied if no text layer was found.'
    };
    const manifestPin = await pinJSON(manifest, { name: `${title}-manifest.json`, keyvalues: { kind: 'manifest' } });

    // 7) Cleanup tmp files
    [pdfPath, brailleTxtPath, brailleBrfPath].forEach(p => { try { fs.unlinkSync(p); } catch (_) {} });

    // cleanup any leftover PNGs
    fs.readdirSync(TMP_DIR).forEach(f => {
      if (f.endsWith('.png')) {
        try { fs.unlinkSync(path.join(TMP_DIR, f)); } catch (_) {}
      }
    });

    // 8) Response
    return res.json({
      ok: true,
      title, author,
      manifestCID: manifestPin.IpfsHash,
      files: {
        pdf: pdfPin.IpfsHash,
        brailleTxt: brailleTxtPin.IpfsHash,
        brailleBrf: brailleBrfPin.IpfsHash
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message || 'Upload failed' });
  }
});

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ PDF→Braille server running on http://localhost:${PORT}`));
