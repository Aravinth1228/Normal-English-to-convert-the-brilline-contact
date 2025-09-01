/**
 * Simple English → Braille (Unicode) converter.
 * Covers A–Z, a–z, 0–9 (with number indicator ⠼), space, comma, period, colon, dash, parentheses, slash, plus, at, hashtag.
 * Extend as needed for your corpus.
 */

const BRAILLE = {
  // Letters (use lowercase mapping; uppercase will be prefixed with ⠠ if you want; here we normalize to lowercase)
  a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑', f: '⠋', g: '⠛', h: '⠓', i: '⠊', j: '⠚',
  k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕', p: '⠏', q: '⠟', r: '⠗', s: '⠎', t: '⠞',
  u: '⠥', v: '⠧', w: '⠺', x: '⠭', y: '⠽', z: '⠵',
  // Basic punctuation
  ' ': ' ', ',': '⠂', ';': '⠆', ':': '⠒', '.': '⠲', '!': '⠖', '?': '⠦', '\'': '⠄', '"': '⠄⠄',
  '-': '⠤', '–': '⠤', '—': '⠤', '(': '⠐⠣', ')': '⠐⠜', '[': '⠷', ']': '⠾', '/': '⠌', '+': '⠖', '=': '⠶',
  '@': '⠈⠁', '#': '⠼', '&': '⠯'
};

// Number mapping uses A–J with number indicator ⠼
const DIGITS = {
  '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑', '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚'
};

const NUMBER_INDICATOR = '⠼';
const CAPITAL_INDICATOR = '⠠';

export function toBraille(input, { keepCaps = false } = {}) {
  if (!input || typeof input !== 'string') return '';

  // Convert consecutive digit runs with a single number indicator
  const parts = input.split(/(\d+)/g); // keep digit groups

  const brailleParts = parts.map(part => {
    if (/^\d+$/.test(part)) {
      // digits only → add one indicator at the start, then map each digit
      return NUMBER_INDICATOR + part.split('').map(d => DIGITS[d]).join('');
    }
    // Non-digit chunk: process char by char
    return part.split('').map(ch => {
      const isUpper = ch >= 'A' && ch <= 'Z';
      const lower = ch.toLowerCase();
      const mapped = BRAILLE.hasOwnProperty(lower) ? BRAILLE[lower] : ch; // passthrough unknown
      if (isUpper) {
        return keepCaps ? (CAPITAL_INDICATOR + mapped) : mapped; // add cap indicator if requested
      }
      return mapped;
    }).join('');
  });

  return brailleParts.join('');
}
