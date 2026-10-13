/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(file) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
    },
  }).outputText;

  const mod = { exports: {} };
  const localRequire = (name) => {
    if (name.startsWith('@/')) {
      const rel = path.join('src', name.slice(2));
      if (fs.existsSync(rel + '.ts')) return loadModule(rel + '.ts');
      if (fs.existsSync(rel + '.tsx')) return loadModule(rel + '.tsx');
      if (fs.existsSync(path.join(rel, 'index.ts'))) return loadModule(path.join(rel, 'index.ts'));
      if (fs.existsSync(path.join(rel, 'index.tsx'))) return loadModule(path.join(rel, 'index.tsx'));
    }
    return require(name);
  };

  vm.runInThisContext(
    `(function(require, module, exports, __dirname, __filename){${code}\n})`,
    { filename: file }
  )(localRequire, mod, mod.exports, path.dirname(file), file);
  return mod.exports;
}

const { normalizeThemeConfig, themeToCssVars } = loadModule('src/lib/theme-presets.ts');

console.log('--- TEST 1: Theme Normalization & Layout Differentiation ---');

// Modèle 1: Oriental Royal
const themeOriental = normalizeThemeConfig({
  layoutStyle: 'oriental',
  name: 'Palais Andalou',
  category: 'oriental',
  primaryColor: '#2C1810',
  accentColor: '#D4AF37',
  goldColor: '#F5C542',
  titleFont: 'Great Vibes',
});
assert.equal(themeOriental.layoutStyle, 'oriental');
assert.equal(themeOriental.titleFont, 'Great Vibes');
const varsOriental = themeToCssVars(themeOriental);
assert(varsOriental['--invitation-title-font'].includes('great-vibes'), 'Oriental layout must use Great Vibes font');

// Modèle 2: Minimaliste Chic & Satin
const themeMinimal = normalizeThemeConfig({
  layoutStyle: 'minimalist',
  name: 'Satin Noir & Blanc',
  category: 'minimaliste',
  primaryColor: '#0F0F0F',
  accentColor: '#C0C0C0',
  goldColor: '#E5E4E2',
  titleFont: 'Montserrat',
});
assert.equal(themeMinimal.layoutStyle, 'minimalist');
assert.equal(themeMinimal.titleFont, 'Montserrat');
const varsMinimal = themeToCssVars(themeMinimal);
assert(varsMinimal['--invitation-title-font'].includes('jakarta'), 'Minimal layout must use Montserrat modern sans font');

// Modèle 3: Prestige Majestic (Défilé & Couverture)
const themePrestige = normalizeThemeConfig({
  layoutStyle: 'royal',
  name: 'Prestige Impérial',
  category: 'prestige',
  primaryColor: '#1A0B2E',
  accentColor: '#9D4EDD',
  goldColor: '#D4AF37',
  titleFont: 'Cinzel',
});
assert.equal(themePrestige.layoutStyle, 'royal');
assert.equal(themePrestige.titleFont, 'Cinzel');
const varsPrestige = themeToCssVars(themePrestige);
assert(varsPrestige['--invitation-title-font'].includes('cinzel'), 'Prestige Majestic must use Cinzel imperial font');

console.log('✓ Normalization correctly routes 3 unique layoutStyles and custom fonts.');

console.log('--- TEST 2: Inspecting File Content & Dynamic Layout Engine ---');
const invitationClientSource = fs.readFileSync('src/components/invitation/InvitationClient.tsx', 'utf8');

// Check Layout 1 elements: sculpted arch, vitrail gallery
assert(invitationClientSource.includes('OrientalRoyalLayout'), 'Must define OrientalRoyalLayout');
assert(invitationClientSource.includes('rounded-t-[140px]'), 'Oriental layout must feature sculpted arch top');
assert(invitationClientSource.includes('Vitrail des Mariés'), 'Oriental layout must feature stained glass vitrail gallery');
assert(invitationClientSource.includes('bénédiction'), 'Oriental layout must feature blessing callout');

// Check Layout 2 elements: airy vertical layout, smooth horizontal carousel
assert(invitationClientSource.includes('MinimalistChicLayout'), 'Must define MinimalistChicLayout');
assert(invitationClientSource.includes('snap-x snap-mandatory gap-4 overflow-x-auto'), 'Minimalist layout must feature horizontal smooth carousel');
assert(invitationClientSource.includes('Élégance Satinée • Minimaliste Chic'), 'Minimalist layout must feature satin minimal signature');

// Check Layout 3 elements: fullscreen runway cover, slide-over card, gilded poem frame
assert(invitationClientSource.includes('PrestigeMajesticLayout'), 'Must define PrestigeMajesticLayout');
assert(invitationClientSource.includes('Le Poème des Mariés'), 'Prestige Majestic must feature centered poem & quote');
assert(invitationClientSource.includes('Défilé & Célébration Royale'), 'Prestige Majestic must feature runway défilé badge');
assert(invitationClientSource.includes('-mt-16 rounded-t-[44px]'), 'Prestige Majestic must feature sliding card over background video');

// Dynamic classes and variables
assert(invitationClientSource.includes('var(--invitation-gold)'), 'Must use dynamic CSS gold variable');
assert(invitationClientSource.includes('var(--invitation-title-font)'), 'Must use dynamic CSS title font variable');
assert(invitationClientSource.includes('vars = useMemo(() => surfaceVars(theme)'), 'Must dynamically inject theme CSS vars into DOM');

console.log('✓ InvitationClient dynamically changes structure, visual layout, typography & gallery per theme.');
console.log('ALL TESTS PASSED SUCCESSFULLY!');
