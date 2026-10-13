/* eslint-disable @typescript-eslint/no-require-imports */
// Render the actual page with controlled hooks; test category and card event behavior.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function evaluate(file, localRequire) {
  const loadedModule = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const t = evaluate('src/i18n/translations.ts', require).TRANSLATIONS.fr;
const templates = [{ slug: 'custom', name: 'Modèle personnalisé', category: 'Catégorie unique', gradient: '#fff', accent: '#000', animationHint: 'wax_seal_burst' }];
const state = ['all', templates, undefined, [], null, null];
let hookIndex;
const hookReact = { ...require('react'), useEffect: () => {}, useRef: () => ({ current: null }), useState: initial => {
  const index = hookIndex++;
  if (state[index] === undefined) state[index] = typeof initial === 'function' ? initial() : initial;
  return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
}};
const components = new Proxy({}, { get: (_, name) => name === '__esModule' ? true : String(name) });
const page = evaluate('src/app/page.tsx', name => {
  if (name === 'react') return hookReact;
  if (name === 'react/jsx-runtime') return require(name);
  if (name === 'framer-motion') return { motion: components, AnimatePresence: 'AnimatePresence', useScroll: () => ({ scrollYProgress: 0 }), useTransform: () => 1 };
  if (name === '@/context/LanguageContext') return { useLanguage: () => ({ t }) };
  if (name === '@/context/CurrencyContext') return { useCurrency: () => ({ formatPrice: value => String(value) }) };
  if (name === '@/lib/whatsapp') return { buildEleganceWhatsAppUrl: () => '#', ELEGANCE_ORDER_WHATSAPP_URL: '#' };
  return components;
}).default;
const render = () => { hookIndex = 0; return page(); };
function allNodes(node) {
  if (Array.isArray(node)) return node.flatMap(allNodes);
  if (!node || typeof node !== 'object' || !node.props) return [];
  return [node, ...allNodes(node.props.children)];
}
let nodes = allNodes(render());
const card = nodes.find(node => node.type === 'Card' && node.props.className.includes('cursor-pointer'));
assert.ok(card);
card.props.onClick();
assert.equal(state[4], templates[0], 'card surface opens demo');
assert.ok(allNodes(render()).some(node => node.type === 'video' || node.props.children === templates[0].name));
for (const button of allNodes(card).filter(node => node.type === 'button')) {
  state[4] = null;
  button.props.onClick({ stopPropagation() {} });
  assert.equal(state[4], templates[0], 'title and demo button open demo');
}
const categoryTab = nodes.find(node => node.type === 'button' && node.props.children === 'Catégorie unique');
assert.ok(categoryTab);
categoryTab.props.onClick();
assert.equal(state[0], 'category:Catégorie unique');
state[1] = [];
state[4] = null;
nodes = allNodes(render());
assert.ok(!nodes.some(node => node.type === 'Card' && node.props.className.includes('cursor-pointer')));
assert.ok(!nodes.some(node => node.type === 'button' && node.props.children === 'Catégorie unique'));
console.log('PASS: card surface, title and demo button, custom category tab, empty catalog without residual cards');
