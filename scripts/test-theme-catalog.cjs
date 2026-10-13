/* eslint-disable @typescript-eslint/no-require-imports */
// Route integration checks. Authorization is stubbed; database mode uses only a temporary model.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const realDatabase = process.argv.includes('--database');
let db;
const rows = [];
if (realDatabase) {
  require('@next/env').loadEnvConfig(process.cwd());
  db = new (require('@prisma/client').PrismaClient)();
} else {
  db = { theme: {
    findUnique: async ({ where }) => rows.find(row => row.slug === where.slug) ?? null,
    findMany: async ({ where } = {}) => rows.filter(row => !where || row.isActive === where.isActive),
    create: async ({ data }) => { const row = { id: String(rows.length), ...data }; rows.push(row); return row; },
    update: async ({ where, data }) => { const row = rows.find(row => row.slug === where.slug); assert.ok(row); Object.assign(row, data); return row; },
    delete: async ({ where }) => { const index = rows.findIndex(row => row.slug === where.slug); assert.ok(index >= 0); return rows.splice(index, 1)[0]; },
  }};
}
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const loadedModule = { exports: {} }; cache.set(file, loadedModule);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = name => {
    if (name === '@/lib/db') return { db };
    if (name === '@/lib/server-auth') return { requireApiRole: async () => ({ session: { role: 'SUPER_ADMIN' } }) };
    if (name.startsWith('@/')) return load(path.join('src', name.slice(2)) + '.ts');
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const admin = load('src/app/api/admin/themes/route.ts');
const catalog = load('src/app/api/themes/route.ts');
const slug = realDatabase ? `catalog-check-${Date.now()}` : 'defile-scenique';
const request = (method, body) => new NextRequest('http://localhost/api/admin/themes', { method, body: body ? JSON.stringify(body) : undefined, headers: { 'Content-Type': 'application/json' } });
async function check(response, status = 200) { assert.equal(response.status, status); const json = await response.json(); assert.equal(json.success, true); return json; }
(async () => {
  let created = false;
  try {
    const result = await check(await admin.POST(request('POST', { slug, name: 'Verification temporaire', category: '  Catégorie personnalisée test  ', allowedPlans: ['privilege', 'imperiale'] })), 201);
    created = true;
    assert.equal(result.data.category, 'Catégorie personnalisée test');
    assert.ok((await check(await catalog.GET())).data.some(row => row.slug === slug));
    await check(await admin.PATCH(request('PATCH', { slug, category: 'Nouvelle catégorie test' })));
    await check(await admin.PATCH(request('PATCH', { slug, allowedPlans: ['imperiale'] })));
    assert.equal((await db.theme.findUnique({ where: { slug } })).category, 'Nouvelle catégorie test');
    await check(await admin.DELETE(request('DELETE', { slug })));
    created = false;
    assert.equal(await db.theme.findUnique({ where: { slug } }), null);
    assert.ok(!(await check(await admin.GET(request('GET')))).data.some(row => row.slug === slug));
    const publicRows = (await check(await catalog.GET())).data;
    assert.ok(!publicRows.some(row => row.slug === slug));
    if (!realDatabase) assert.deepEqual(publicRows, []);
    assert.equal((await admin.POST(request('POST', { name: 'Invalid', category: '   ' }))).status, 400);
    console.log(`PASS: custom category, category edit, plan independence, hard delete, repeated admin/public reads${realDatabase ? ' (real database)' : ', empty catalog and former preset slug'}`);
  } finally {
    if (created) await db.theme.delete({ where: { slug } });
    if (realDatabase) await db.$disconnect();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
