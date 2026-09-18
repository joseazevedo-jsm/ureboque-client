const fs = require('fs');
const path = require('path');

const sourceRoot = path.join(__dirname, '..', 'src');
const themeFile = path.join(sourceRoot, 'theme', 'index.js');
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const rules = [
  ['raw color', /#[0-9a-f]{3,8}\b|rgba?\s*\(/i],
  ['raw type size', /\bfontSize\s*:\s*[1-9]/],
  ['raw spacing', /\b(?:padding|margin)(?:Top|Right|Bottom|Left|Horizontal|Vertical)?\s*:\s*[1-9]/],
  ['raw radius', /\bborderRadius\s*:\s*[1-9]/],
];

function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collect(target);
    return sourceExtensions.has(path.extname(entry.name)) ? [target] : [];
  });
}

const failures = [];
for (const file of collect(sourceRoot)) {
  if (path.normalize(file) === path.normalize(themeFile)) continue;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const [name, expression] of rules) {
      if (expression.test(line)) {
        failures.push(`${path.relative(path.join(__dirname, '..'), file)}:${index + 1} ${name}: ${line.trim()}`);
      }
    }
  });
}

if (failures.length) {
  console.error('Design-system audit failed. Replace one-off visual values with tokens:\n');
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Design-system audit passed across ${collect(sourceRoot).length} source files.`);
