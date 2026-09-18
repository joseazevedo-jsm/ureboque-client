// Parse every source file with the project's Babel configuration.
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
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
  try {
    babel.parseSync(fs.readFileSync(f, 'utf8'), { filename: f, cwd: path.join(__dirname, '..') });
  } catch (e) {
    bad++;
    console.log('PARSE FAIL', path.relative(root, f), e.message.split('\n')[0]);
  }
}
console.log(bad ? bad + ' failures' : `all ${files.length} files parse OK`);
