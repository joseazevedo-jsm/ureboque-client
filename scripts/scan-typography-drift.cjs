const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'src');
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(e.name)) files.push(p);
  }
})(root);
const out = [];
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  const hits = [];
  lines.forEach((l, i) => {
    if (/\btypeScale\./.test(l) && !/import/.test(l)) hits.push((i + 1) + ' typeScale: ' + l.trim());
    if (/fontWeight\s*:\s*['"]\d/.test(l)) hits.push((i + 1) + ' fontWeight: ' + l.trim());
    if (/\bletterSpacing\s*:/.test(l)) hits.push((i + 1) + ' letterSpacing: ' + l.trim());
    const icon = l.match(/size=\{?scale\((\d+)\)/);
    if (icon && ![16, 20, 24, 32, 48, 52, 64, 72, 80].includes(Number(icon[1]))) hits.push((i + 1) + ' iconOffScale: ' + l.trim());
  });
  if (hits.length) out.push('=== ' + path.relative(path.join(__dirname, '..'), f).replace(/\\/g, '/') + ' ===\n' + hits.join('\n'));
}
console.log('files with hits: ' + out.length + '\n');
console.log(out.join('\n\n'));
