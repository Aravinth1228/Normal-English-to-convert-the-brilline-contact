cd # PDF → Braille IPFS Uploader

End-to-end sample to upload a normal English PDF, extract text, convert to Unicode Braille, and pin outputs to IPFS via Pinata. Includes a minimal web UI.

## 🚀 Quick Start

1. **Clone and install**
   ```bash
   cd server
   cp .env.example .env
   # paste your PINATA_JWT or API key/secret
   npm i
   npm run start
   ```

2. **Open the web UI**
   - Navigate to http://localhost:4000
   - Fill Title, Author, and choose a PDF, then submit.

3. **Outputs**
   - Original PDF pinned to IPFS
   - `*.braille.txt` (Unicode Braille) pinned
   - `*.brf` pinned
   - A manifest JSON linking all CIDs

## 🧠 Notes
- The PDF text extractor (`pdf-parse`) works for text-based PDFs; for scanned PDFs, add OCR (e.g., Tesseract) in a future enhancement.
- The Braille map is basic Grade-1 (uncontracted) mapping. Extend `braille.js` for more punctuation/Grade-2 contractions as needed.
- You can integrate blockchain smart contracts later by storing the manifest CID on-chain for access control, royalties, etc.

## 🔐 Security
- Keep your `.env` out of version control.
- Prefer `PINATA_JWT` over API key/secret.
