// One-shot codemod: migrate typeScale.* font sizes to shared typography role
// references, normalize out-of-vocabulary font weights, and drop the alias
// from theme imports. Idempotent. Run from the client root.
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

const roles = {
  caption: 'caption', small: 'bodySmall', body: 'body',
  title: 'h3', heading: 'h2', display: 'h1', hero: 'hero',
};
const weightFix = /fontWeight\s*:\s*(['"])\s*(300|800|900)\s*\1/g;

let changed = 0;
const leftovers = [];
for (const file of files) {
  const rel = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
  if (rel.endsWith('src/styles.js') || rel.endsWith('src/theme/index.js')) continue;
  let src = fs.readFileSync(file, 'utf8');
  const original = src;

  src = src.replace(/fontSize:\s*typeScale\.(\w+)/g, (m, key) => {
    const role = roles[key];
    return role ? `fontSize: typography.${role}.fontSize` : m;
  });
  // Append the role line-height right after its font size when the statement
  // does not already declare one (same line) and it is a fontSize we just wrote.
  src = src.split(/(\r?\n)/).map((chunk, i, arr) => {
    if (i % 2 === 1) return chunk;
    if (!chunk.includes('fontSize: typography.')) return chunk;
    if (/\blineHeight\s*:/.test(chunk)) return chunk;
    return chunk.replace(/fontSize:\s*typography\.(\w+)\.fontSize/g,
      (m, role) => `fontSize: typography.${role}.fontSize, lineHeight: typography.${role}.lineHeight`);
  }).join('');
  src = src.replace(/lineHeight:\s*typeScale\.(\w+)/g, (m, key) =>
    roles[key] ? `lineHeight: typography.${roles[key]}.lineHeight` : m);
  src = src.replace(weightFix, (m, q, w) =>
    `fontWeight: ${q}${w === '300' ? '400' : '700'}${q}`);

  // Fix theme imports: add typography when used, drop typeScale when unused.
  src = src.replace(/import\s*\{([^}]*)\}\s*from\s*(['"])((?:\.\.\/)*\.\.?)*?\/?theme\2;?/g,
    (m, names) => {
      const usesType = /\btypography\b/.test(src.replace(m, ''));
      const usesScale = /\btypeScale\b/.test(src.replace(m, ''));
      let list = names.split(',').map((s) => s.trim()).filter(Boolean);
      if (usesType && !list.includes('typography')) list.push('typography');
      if (!usesScale) list = list.filter((n) => n !== 'typeScale');
      return m.replace(`{${names}}`, `{ ${list.join(', ')} }`);
    });

  if (src !== original) {
    fs.writeFileSync(file, src);
    changed++;
  }
  src.split(/\r?\n/).forEach((l, i) => {
    if (/\btypeScale\./.test(l) && !/import/.test(l)) leftovers.push(`${rel}:${i + 1} ${l.trim()}`);
  });
}
console.log(`codemod updated ${changed} files`);
console.log(leftovers.length ? 'Remaining typeScale usages:\n' + leftovers.join('\n') : 'No typeScale usages remain.');
