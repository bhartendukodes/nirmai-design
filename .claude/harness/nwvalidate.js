#!/usr/bin/env node
// nwvalidate.js — static validator for NirmAI-Website.html (recreated from plan Task 1 Step 1)
// usage: node nwvalidate.js <expectedPages> [file]
const fs = require('fs');
const expected = parseInt(process.argv[2] || '5', 10);
const file = process.argv[3] || '/Users/bhartendukodes/MYWORK/NirmAI-Website.html';
const html = fs.readFileSync(file, 'utf8');
let fail = 0;
const check = (name, ok, detail) => { console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? ' — ' + detail : '')); if (!ok) fail++; };

// 1. banned artifacts
const banned = html.match(/x-dc|support\.js|\{\{/g);
check('no x-dc / support.js / {{', !banned, banned ? banned.length + ' hits' : '');

// 2. emoji scan (incl. ✓ → ← ↻ which must also be absent — SVG only)
const emoji = [...html].filter(c => { const p = c.codePointAt(0); return (p >= 0x1F300 && p <= 0x1FAFF) || (p >= 0x2600 && p <= 0x27BF) || '✓→←↻'.includes(c); });
check('emoji/glyph scan', emoji.length === 0, emoji.length ? emoji.length + ' glyphs: ' + [...new Set(emoji)].join(' ') : '');

// 3. tag balance
for (const tag of ['div', 'section', 'main', 'button', 'span', 'svg', 'figure']) {
  const open = (html.match(new RegExp('<' + tag + '(\\s|>)', 'g')) || []).length;
  const close = (html.match(new RegExp('</' + tag + '>', 'g')) || []).length;
  check('tag balance <' + tag + '>', open === close, open + ' open / ' + close + ' close');
}

// 4. inline script syntax
const scripts = [...html.matchAll(/<script((?![^>]*src)[^>]*)>([\s\S]*?)<\/script>/g)];
let synErr = null;
scripts.forEach((m, i) => {
  const isModule = /type\s*=\s*["']module["']/.test(m[1]);
  // module scripts allow top-level await — wrap in async body for the syntax check
  const body = isModule ? '(async()=>{' + m[2].replace(/\bimport\s*\(/g, 'Promise.resolve(').replace(/^\s*import\b[^;]*;/gm, '') + '})()' : m[2];
  try { new Function(body); } catch (e) { synErr = synErr || ('script #' + (i + 1) + ': ' + e.message); }
});
check('inline script syntax (' + scripts.length + ' scripts)', !synErr, synErr || '');

// 5. URL audit — allow only google fonts, approved unsplash manifest, poly.pizza model, jsdelivr CDN
const urls = [...new Set((html.match(/https?:\/\/[^"'\s)>]+/g) || []))];
const allowedHosts = /^(https:\/\/fonts\.(googleapis|gstatic)\.com|https:\/\/images\.unsplash\.com|https:\/\/static\.poly\.pizza|https:\/\/cdn\.jsdelivr\.net|https:\/\/poly\.pizza|https:\/\/creativecommons\.org|https?:\/\/www\.w3\.org\/)/;
const badUrls = urls.filter(u => !allowedHosts.test(u));
check('URL audit (' + urls.length + ' unique)', badUrls.length === 0, badUrls.slice(0, 5).join(' , '));

// 6. size
check('size <= 600KB', html.length <= 600 * 1024, Math.round(html.length / 1024) + 'KB');

// 7. page count
const pages = (html.match(/class="nw-page/g) || []).length;
check('nw-page count === ' + expected, pages === expected, String(pages));

console.log(fail === 0 ? 'ALL CHECKS PASS' : fail + ' CHECK(S) FAILED');
process.exit(fail === 0 ? 0 : 1);
