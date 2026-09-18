// Verify every file that dereferences a theme token actually imports it.
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
let bad = 0;
for (const f of files) {
  if (f.endsWith(path.join('theme', 'index.js'))) continue;
  const src = fs.readFileSync(f, 'utf8');
  const body = src.replace(/import[^;]+;/g, '');
  for (const tok of ['typography', 'sizes', 'colors', 'spacing']) {
    if (!new RegExp('\\b' + tok + '\\.').test(body)) continue;
    const imp = src.match(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]*theme['"]/);
    if (!imp || !imp[1].split(',').map((s) => s.trim()).includes(tok)) {
      bad++;
      console.log('MISSING IMPORT', tok, 'in', path.relative(root, f));
    }
  }
  if (/\btypeScale\b/.test(src)) { bad++; console.log('TYPESCALE LEFT in', path.relative(root, f)); }
}
console.log(bad ? bad + ' problems' : 'imports and alias checks clean across ' + files.length + ' files');
