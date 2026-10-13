/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = name => name.startsWith('@/')
    ? load(path.join('src', name.slice(2)) + '.ts') : require(name);
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, module, module.exports);
  return module.exports;
}

const { normalizeThemeConfig } = load('src/lib/theme-presets.ts');
for (const layoutStyle of ['oriental', 'minimalist', 'royal']) {
  const theme = normalizeThemeConfig({ layoutStyle, slug: 'medina-orientale', coverVideoUrl: 'https://example.com/couple.mp4' });
  assert.equal(theme.layoutStyle, layoutStyle, 'An explicit layout must override legacy inference');
  assert.equal(theme.coverVideoUrl, 'https://example.com/couple.mp4');
  assert.equal(normalizeThemeConfig(theme).layoutStyle, layoutStyle, 'Normalization must be stable');
}
assert.equal(normalizeThemeConfig({ slug: 'medina-orientale' }).layoutStyle, 'oriental');
assert.equal(normalizeThemeConfig({ slug: 'minimal-editorial' }).layoutStyle, 'minimalist');
assert.equal(normalizeThemeConfig({ layoutStyle: 'invalid' }).layoutStyle, 'royal');
assert.equal(normalizeThemeConfig(null).coverVideoUrl, null);
console.log('PASS: explicit layouts, legacy model inference, cover video preservation and safe fallback');
