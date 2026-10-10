import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parse } from '@babel/parser';

// Parse syntax rather than matching lesson prose or code examples in strings.
export function localImportSpecifiers(source) {
  const ast = parse(source, { sourceType: 'unambiguous', plugins: ['jsx'], createImportExpressions: true });
  const specifiers = new Set();
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    let value;
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration', 'ImportExpression'].includes(node.type)) value = node.source;
    if (node.type === 'CallExpression' && node.callee?.name === 'require') value = node.arguments[0];
    const specifier = value?.type === 'StringLiteral' ? value.value : value?.type === 'TemplateLiteral' && value.expressions.length === 0 ? value.quasis[0].value.cooked : null;
    if (specifier?.startsWith('.')) specifiers.add(specifier);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(ast.program);
  return [...specifiers];
}

export async function collectLocalImports(root, sources) {
  const pending = [...sources];
  const visited = new Set();
  const dependencies = new Set();
  while (pending.length) {
    const source = pending.pop();
    if (visited.has(source) || !/\.(?:[cm]?js|jsx)$/.test(source)) continue;
    visited.add(source);
    let specifiers;
    try { specifiers = localImportSpecifiers(await readFile(path.join(root, source), 'utf8')); }
    catch (error) { throw new Error(`Cannot inspect imports in ${source}: ${error.message}`, { cause: error }); }
    for (const specifier of specifiers) {
      const base = path.resolve(root, path.dirname(source), specifier.split(/[?#]/)[0]);
      let resolved;
      for (const candidate of [base, ...['.js', '.jsx', '.mjs', '.cjs', '.json', '/index.js', '/index.jsx'].map(extension => base + extension)]) {
        try { if ((await stat(candidate)).isFile()) { resolved = candidate; break; } }
        catch (error) { if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error; }
      }
      assert.ok(resolved, `Missing local import: ${source} -> ${specifier}`);
      const relative = path.relative(root, resolved).replaceAll('\\', '/');
      assert.ok(!relative.startsWith('../') && !path.isAbsolute(relative), `Import outside repository: ${source} -> ${specifier}`);
      dependencies.add(relative);
      // ?raw and ?url expose a file, not an executable dependency graph.
      if (!/[?](?:raw|url)(?:&|$)/.test(specifier)) pending.push(relative);
    }
  }
  return [...dependencies];
}
