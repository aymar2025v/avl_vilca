// Prueba diferencial: el motor JS y el avl.h REAL (compilado con g++) deben producir el MISMO árbol
// (claves, alturas y contador de rotaciones) tras cada operación.   node tools/compare_cpp.mjs
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AVLTree } from '../js/core/AVLTree.js';

const exe = join(tmpdir(), 'avl_harness' + (process.platform === 'win32' ? '.exe' : ''));
execFileSync('g++', ['-std=c++17', '-O1', fileURLToPath(new URL('harness.cpp', import.meta.url)), '-o', exe], { stdio: 'inherit' });

let seed = 12345;                                   // PRNG con semilla: los resultados se pueden repetir
const rnd = n => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n;
const pre = n => n ? [`${n.key}:${n.height}`, ...pre(n.left), ...pre(n.right)] : [];

let total = 0;
for (const range of [10, 40, 300]) {                // árboles chicos (muchas colisiones/borrados) y grandes
  const ops = Array.from({ length: 4000 }, () => (rnd(10) < 6 ? 'i ' : 'd ') + rnd(range));
  const cpp = execFileSync(exe, { input: ops.join('\n') + '\n', maxBuffer: 1 << 28 }).toString().trim().split('\n');
  const t = new AVLTree(); t.mute = true;
  ops.forEach((o, i) => {
    const k = +o.slice(2);
    o[0] === 'i' ? t.insert(k) : t.delete(k);
    const js = pre(t.root).join(' ') + (t.root ? ' ' : '') + `| rot=${t.rotations}`;
    if (js !== cpp[i]) { console.error(`✗ rango ${range}, operación #${i} (${o}) difiere\n  JS : ${js}\n  C++: ${cpp[i]}`); process.exit(1); }
    total++;
  });
}
console.log(`OK — ${total} operaciones: el motor JS y avl.h producen árboles idénticos (claves, alturas y rotaciones)`);
