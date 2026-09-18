// Regenerate docs/design/client-tokens.json from src/theme/index.js with a
// stubbed react-native Platform so the theme can be evaluated by Node.
const fs = require('fs');
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');

const clientRoot = path.join(__dirname, '..');
const themeFile = path.join(clientRoot, 'src', 'theme', 'index.js');
const outFile = path.join(clientRoot, 'docs', 'design', 'client-tokens.json');

let currentOS = 'android';
const stub = {
  Platform: {
    get OS() { return currentOS; },
    select: (spec) => (currentOS in spec ? spec[currentOS] : spec.default),
  },
};
const origLoad = Module._load;
Module._load = function patched(request, ...rest) {
  if (request === 'react-native') return stub;
  return origLoad.call(this, request, ...rest);
};

function loadTheme(os) {
  currentOS = os;
  const code = babel.transformFileSync(themeFile, { cwd: clientRoot }).code;
  const m = new Module(themeFile, null);
  m.filename = themeFile;
  m.paths = Module._nodeModulePaths(path.dirname(themeFile));
  m._compile(code, themeFile);
  return m.exports;
}

const pick = (t) => ({
  colors: t.colors, spacing: t.spacing, borderRadius: t.borderRadius,
  borderWidths: t.borderWidths, fonts: t.fonts, typography: t.typography,
  shadows: t.shadows, sizes: t.sizes, layout: t.layout,
  fontWeights: t.fontWeights, keyboardConfig: t.keyboardConfig,
  interactions: t.interactions, componentStyles: t.componentStyles,
  animations: t.animations,
});
const deep = (v) => JSON.parse(JSON.stringify(v));

const out = {
  _description: 'Generated snapshot of src/theme/index.js. Logical dp/sp; exported values resolved for each platform.',
  platforms: {
    ios: deep(pick(loadTheme('ios'))),
    android: deep(pick(loadTheme('android'))),
    web: deep(pick(loadTheme('web'))),
  },
};
fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n');
console.log('client-tokens.json regenerated for ios/android/web');
