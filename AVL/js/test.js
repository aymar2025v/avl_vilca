// Pruebas del motor:  node js/test.js   (usa AVL/package.json con "type":"module")
import { AVLTree, MAX_ANIMATED } from './core/AVLTree.js';
import { CASES, applyCase, loadExample } from './core/cases.js';
import { parseKeys } from './utils/input.js';
import { stepOverIndex, stepOutIndex } from './utils/stepping.js';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { CPP_SOURCE, TAGS, FN_META, FN_ORDER } from './utils/cpp_source.js';
import { renderCode, NODE_VARS } from './utils/highlight.js';
import { validateName, suggestNames, nameSet } from './utils/names.js';
for (const f of FN_ORDER) assert.ok(CPP_SOURCE[f] && FN_META[f], `falta la función ${f}`);
for (const [f, tags] of Object.entries(TAGS)) for (const [t, ls] of Object.entries(tags)) assert.ok(ls.length && ls.every(i => i < CPP_SOURCE[f].length), `etiqueta vacía ${f}:${t}`);
assert.ok(Object.values(CPP_SOURCE).flat().every(l => !l.includes('//')), 'quedan comentarios');

const count = n => n ? 1 + count(n.left) + count(n.right) : 0;
const inv = (n, lo = -Infinity, hi = Infinity) => {
  if (!n) return 0;
  assert.ok(n.key > lo && n.key < hi, 'orden BST roto');
  const l = inv(n.left, lo, n.key), r = inv(n.right, n.key, hi), h = 1 + Math.max(l, r);
  assert.ok(Math.abs(r - l) <= 1, 'desbalance AVL'); assert.equal(n.height, h, 'altura incorrecta'); return h;
};
const t = new AVLTree();
[10, 20, 30].forEach(k => t.insert(k));
assert.equal(t.root.key, 20, 'RR'); assert.equal(t.rotations, 1);
const t2 = new AVLTree(); [30, 10, 20].forEach(k => t2.insert(k)); assert.equal(t2.root.key, 20, 'LR'); assert.equal(t2.rotations, 2);

let seen = 0;
for (let s = 0; s < 200; s++) {
  const a = new AVLTree(), set = new Set();
  for (let i = 0; i < 50; i++) {
    const k = Math.floor(Math.random() * 30);
    if (Math.random() < .6) { a.insert(k); set.add(k); } else { a.delete(k); set.delete(k); }
    inv(a.root); assert.equal(count(a.root), set.size);
    // nodos visibles = nodos del árbol en cada paso (el nodo recién creado flota hasta asignarse)
    a.history.forEach((f, j) => {
      const vis = count(f.snapshot) + Object.values(f.floatingSnapshots).reduce((x, q) => x + count(q), 0);
      assert.ok(vis >= set.size - 1 && vis <= set.size + 1 + 1, `frame ${j}: visibles=${vis}`);
      seen++;
    });
  }
}
// durante una rotación no puede faltar ningún nodo
const r = new AVLTree(); [40, 20, 60, 10, 30, 5].forEach(k => r.insert(k)); r.insert(3);
r.history.filter(f => f.debug.file.startsWith('rotar')).forEach(f => {
  assert.equal(count(f.snapshot) + Object.values(f.floatingSnapshots).reduce((x, q) => x + count(q), 0), 7, 'nodo perdido en rotación');
});
const has = (n, id) => !!n && (n.id === id || has(n.left, id) || has(n.right, id));
r.history.filter(f => f.debug.file.startsWith('rotar')).forEach(f => assert.ok(f.debug.dir && (has(f.snapshot, f.debug.pivot) || Object.values(f.floatingSnapshots).some(s => has(s, f.debug.pivot))), 'pivote no visible'));
['inorder', 'preorder', 'postorder'].forEach(m => r[m]()); r.search(99); r.search(30); r.delete(99); r.findMin(); r.findMax(); r.getHeight();

// ── v7: el C++ que muestra el panel debe ser EXACTAMENTE el de ../avl.h ──
// (sin comentarios; se ignoran espacios, llaves, "std::" y los parámetros de plantilla)
{
  const norm = t => t.replace(/\s+/g, '').replace(/std::/g, '').replace(/template<[^>]*>/g, '')
    .replace(/NodoBST<K,V>/g, 'Nodo').replace(/NodoBST/g, 'Nodo').replace(/[{}]/g, '');
  const avl = fs.readFileSync(new URL('../avl.h', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/^\s*#.*$/gm, '');
  const chunks = []; let depth = 0, par = 0, cur = '';
  for (let i = 0; i < avl.length; i++) {              // trozos de nivel superior (las llaves de V{} dentro de ( ) no cuentan)
    const ch = avl[i]; cur += ch;
    if (ch === '(') par++; else if (ch === ')') par--;
    else if (par === 0 && ch === '{') depth++;
    else if (par === 0 && ch === '}' && --depth === 0) {
      let j = i + 1; while (/\s/.test(avl[j] ?? '')) j++;
      if (avl[j] === ';') { cur += ';'; i = j; }
      chunks.push(cur); cur = '';
    } else if (par === 0 && ch === ';' && depth === 0) { chunks.push(cur); cur = ''; }
  }
  const nameOf = c => {
    const t = c.replace(/template\s*<[^>]*>/g, '');
    if (/\bstruct\s+NodoBST\b/.test(t)) return 'constructor_nodo';
    if (/\binline\s+int\s+contador_rotaciones\b/.test(t)) return 'contador_rotaciones';
    const n = /(\w+)\s*\(/.exec(t)?.[1];
    return n === 'insertar_avl' ? 'insertar' : n;
  };
  const vistos = new Set();
  for (const c of chunks) {
    const nm = nameOf(c); if (!nm) continue;
    assert.ok(CPP_SOURCE[nm], `avl.h tiene "${nm}" pero el simulador no lo muestra`);
    assert.equal(norm(CPP_SOURCE[nm].join('\n')), norm(c), `el código de "${nm}" en el panel ya no coincide con avl.h`);
    vistos.add(nm);
  }
  assert.ok(vistos.size >= 14, `solo se comparó ${vistos.size} funciones de avl.h`);
}

// ── v7: reiniciar, ids, lotes, modo silencioso ──
{
  const t = new AVLTree(); [10, 20, 30].forEach(k => t.insert(k)); assert.equal(t.rotations, 1);
  t.clear(); assert.equal(t.rotations, 0, 'clear() debe reiniciar el contador de rotaciones'); assert.equal(t.size(), 0);
  const ids = new Set(); const q = new AVLTree(); for (let i = 0; i < 100; i++) q.insert(i);
  const walk = n => { if (n) { ids.add(n.id); walk(n.left); walk(n.right); } }; walk(q.root); assert.equal(ids.size, 100, 'ids repetidos');

  const m = new AVLTree(); m.mute = true; m.insert(5); assert.equal(m.history.length, 0, 'mute no debe grabar'); assert.equal(m.size(), 1);

  const b = new AVLTree(); b.batch([1, 2, 3, 4, 5, 6, 7], k => b.insert(k));
  assert.equal(b.size(), 7); assert.ok(b.history.length > 7, 'lote pequeño: se animan todas las inserciones');
  assert.ok(b.history.at(-1).debug.descripcion.includes('Fin de insertar_avl(7)'));
  const big = new AVLTree(), ks = Array.from({ length: MAX_ANIMATED + 20 }, (_, i) => i + 1);
  big.batch(ks, k => big.insert(k));
  assert.equal(big.size(), ks.length); assert.ok(big.history.at(-1).debug.descripcion.includes(`insertar_avl(${ks.at(-1)})`));
  assert.ok(big.history.length < 200, `lote grande: solo debe grabarse la última operación (${big.history.length} fotogramas)`);
  assert.equal(inv(big.root) > 0, true);
}

// ── v7: eliminar con un solo hijo (auto hijo = move(...); raiz = move(hijo)) ──
{
  for (const [build, del, hijo, mov] of [[[20, 10, 30, 35], 30, 'hijoDer', 'movDer'],     // 30 solo tiene hijo DER  → 2a
                                          [[20, 10, 30, 25], 30, 'hijoIzq', 'movIzq']]) {   // 30 solo tiene hijo IZQ  → 2b
    const t = new AVLTree(); build.forEach(k => t.insert(k)); t.delete(del);
    const usados = t.history.filter(f => f.debug.file === 'eliminar_avl').map(f => f.debug.lines.join());
    for (const tag of [hijo, mov]) assert.ok(usados.includes(TAGS.eliminar_avl[tag].join()), `falta el paso "${tag}"`);
    assert.ok(t.history.some(f => f.floatingSnapshots.hijo), 'debe aparecer "hijo" flotando');
    inv(t.root); assert.equal(t.size(), build.length - 1);
    t.history.forEach(f => assert.ok(count(f.snapshot) + Object.values(f.floatingSnapshots).reduce((x, q) => x + count(q), 0) >= build.length - 1, 'nodo perdido'));
  }
}

// ── v7: lista de claves ──
{
  assert.deepEqual(parseKeys('7').keys, [7]);
  assert.deepEqual(parseKeys('10,20 30;40').keys, [10, 20, 30, 40]);
  assert.deepEqual(parseKeys('1..5').keys, [1, 2, 3, 4, 5]);
  assert.deepEqual(parseKeys('3..1,-1..0').keys, [3, 2, 1, -1, 0]);
  assert.deepEqual(parseKeys('-0').keys, [0]); assert.ok(Object.is(parseKeys('-0').keys[0], 0));
  for (const bad of ['', '  ', '3.7', '1e2', 'abc', '10000', '1..', '..5', '1 .. 5', '--3'])
    assert.ok(parseKeys(bad).error, `debería rechazar "${bad}"`);
  assert.ok(parseKeys('1..999', { maxCount: 255 }).error, 'rango demasiado grande');
  assert.equal(parseKeys('1..255', { maxCount: 255 }).keys.length, 255);
}

// ── v7: casos de la guía = asserts de avl_main.cpp, y botón Ejemplo ──
{
  for (const c of CASES) {
    const t = new AVLTree(), r = applyCase(t, c);
    assert.ok(r.ok, `caso ${c.id} no cumple lo que comprueba avl_main.cpp`); assert.ok(r.frames.length > 0, `caso ${c.id} sin fotogramas`);
    inv(t.root);
  }
  const t = new AVLTree(); t.rotations = 99;
  const fr = loadExample(t);
  assert.equal(fr.length, 1); assert.equal(t.size(), 7); assert.equal(t.rotations, 0); inv(t.root);
}


// ── v8: entrar en actualizar_altura()/factor_balance() y Paso sobre / Salir ──
{
  const t = new AVLTree(); [20, 10, 30, 5].forEach(k => t.insert(k)); t.insert(3);          // 3 provoca una rotación (LL)
  const H = t.history, depth = f => f.debug.stack.length;
  const det = H.filter(f => f.debug.detail);
  assert.ok(det.some(f => f.debug.file === 'actualizar_altura') && det.some(f => f.debug.file === 'factor_balance'), 'faltan fotogramas anidados');
  assert.ok(det.every(f => ['actualizar_altura', 'factor_balance'].includes(f.debug.file)), 'solo esas dos funciones son anidadas');
  H.forEach((f, i) => {                                         // un nivel de pila más que el fotograma que las llama
    if (!f.debug.detail) return;
    let k = i; while (H[k].debug.detail) k--;
    assert.equal(depth(f), depth(H[k]) + 1, `fotograma ${i}: la pila de una llamada anidada debe tener un nivel más`);
    assert.ok(f.debug.stack.at(-1).startsWith(f.debug.file), 'la cima de la pila debe ser la función en la que se está');
  });
  // sin los anidados la secuencia sigue siendo coherente (se puede ocultar el detalle)
  assert.ok(H.filter(f => !f.debug.detail).length < H.length);
  // la altura cambia DENTRO de actualizar_altura, no antes
  const i = H.findIndex(f => f.debug.file === 'actualizar_altura' && f.debug.lines.join() === TAGS.actualizar_altura.call.join());
  assert.ok(i > 0 && H[i + 1].debug.file === 'actualizar_altura');

  // Saltar: desde la llamada recursiva izquierda se llega a "al regresar" de ESA misma llamada
  const u = new AVLTree(); [20, 10, 30, 5].forEach(k => u.insert(k)); u.insert(3);
  const F = u.history, a = F.findIndex(f => f.debug.file === 'insertar' && f.debug.lines.join() === TAGS.insertar.izq.join() && depth(f) === 1);
  assert.ok(a >= 0); const o = stepOverIndex(F, a);
  assert.equal(F[o].debug.file, 'insertar'); assert.equal(depth(F[o]), 1);
  assert.equal(F[o].debug.lines.join(), TAGS.insertar.bal.join(), 'Saltar debe aterrizar en balancear(raiz) del mismo nivel');
  assert.ok(o > a + 3, 'Saltar debe haber pasado por encima de la recursión');
  // Saltar desde "actualizar_altura(n)" en balancear se salta sus pasos internos
  const h = F.findIndex(f => f.debug.file === 'balancear' && f.debug.lines.join() === TAGS.balancear.h.join());
  const oh = stepOverIndex(F, h); assert.equal(F[oh].debug.file, 'balancear'); assert.ok(oh >= h + 3, 'debe saltar los 2 pasos internos');
  // Salir: desde dentro de actualizar_altura se vuelve a balancear
  const inn = F.findIndex(f => f.debug.detail), out = stepOutIndex(F, inn);
  assert.ok(depth(F[out]) < depth(F[inn]) && !F[out].debug.detail);

  // propiedades en historias reales: avanzan, respetan la profundidad y no se pasan
  const r = new AVLTree(); r.mute = true; for (let k = 0; k < 40; k++) r.insert((k * 37) % 101); r.mute = false;
  for (const op of [() => r.insert(55), () => r.delete(37), () => r.insert(-8), () => r.delete(74)]) {
    op(); const G = r.history;
    for (let k = 0; k < G.length; k++) {
      const ov = stepOverIndex(G, k), ot = stepOutIndex(G, k);
      if (k === G.length - 1) { assert.equal(ov, k); assert.equal(ot, k); continue; }
      assert.ok(ov > k && ot >= ov, 'Saltar/Salir deben avanzar (Salir nunca antes que Saltar)');
      assert.ok(ov === G.length - 1 || depth(G[ov]) <= depth(G[k])); assert.ok(ot === G.length - 1 || depth(G[ot]) < depth(G[k]));
      for (let m = k + 1; m < ov; m++) assert.ok(depth(G[m]) > depth(G[k]), 'Saltar no debe pasar por encima de un fotograma al mismo nivel');
    }
  }
}


// ── v9: nombres de nodo ──
{
  // validación y sugerencias
  assert.equal(validateName('A'), ''); assert.equal(validateName('nodo_1'), '');
  for (const bad of ['', '  ', '1A', 'A B', 'raiz', 'y', 'nullptr', 'A-B', 'abcdefghijk']) assert.ok(validateName(bad), `debería rechazar "${bad}"`);
  assert.ok(validateName('a', nameSet(['A'])), 'A y a son el mismo nombre');
  assert.deepEqual(suggestNames(new Set(), 4), ['A', 'B', 'C', 'D']);
  assert.deepEqual(suggestNames(nameSet(['A', 'C']), 3), ['B', 'D', 'E']);
  const sg = suggestNames(new Set(), 60); assert.equal(new Set(sg).size, 60); assert.ok(sg.every(x => !validateName(x)), 'sugerencias válidas');
  assert.ok(!sg.includes('K') && !sg.includes('V') && !sg.includes('T'));

  // insertar con nombres explícitos; duplicados y nombres repetidos
  const t = new AVLTree();
  t.insert(10, null, 'Ana'); t.insert(20, null, 'Beto'); t.insert(30, null, 'Cami');
  assert.equal(t.root.name, 'Beto', 'tras la rotación la raíz es otro nodo y cada nodo conserva SU nombre');
  assert.equal(t.root.left.name, 'Ana'); assert.equal(t.root.right.name, 'Cami');
  assert.throws(() => t.insert(40, null, 'ana'), /en uso/, 'nombre repetido');
  assert.throws(() => t.insert(40, null, 'y'), /C\+\+/, 'nombre reservado');
  t.insert(20, 'x', 'IGNORADO'); assert.equal(t.size(), 3, 'clave existente: el nombre se ignora');
  t.insert(40); assert.deepEqual(new Set(t.names()), new Set(['Ana', 'Beto', 'Cami', 'A']), 'sin nombre → el siguiente libre');
  assert.equal(new Set(t.names()).size, t.size());
  // eliminar con 2 hijos: el nodo conserva su nombre (en C++ solo se copia la clave)
  const d = new AVLTree(); [20, 10, 30, 25, 35].forEach(k => d.insert(k)); const nameRoot = d.root.name; d.delete(20);
  assert.equal(d.root.name, nameRoot); assert.equal(d.root.key, 25);

  // cada fotograma lleva a qué apunta cada variable; los huecos se llaman "A->izq" o "raiz"
  const SLOT = /^(raiz|\w+->(izq|der))$/;
  const sane = H => H.forEach(f => {
    for (const [k, b] of Object.entries({ ...f.debug.alias, ...f.debug.names })) assert.ok(b.slot !== undefined ? SLOT.test(b.slot) : b.name && Number.isFinite(b.hue), `binding de ${k}`);
  });
  const r = new AVLTree(); [40, 20, 60, 10, 30, 50, 5].forEach(k => r.insert(k)); r.insert(3); sane(r.history);
  // al bajar con insertar_avl(raiz->izq) la llamada siguiente recibe EXACTAMENTE ese hijo (o su hueco)
  const find = (n, id) => !n ? null : n.id === id ? n : find(n.left, id) ?? find(n.right, id);
  const u = new AVLTree(); [40, 20, 60, 10, 30, 50, 5].forEach(k => u.insert(k)); u.insert(7);
  let bajadas = 0;
  u.history.forEach((f, i) => {
    if (f.debug.file !== 'insertar' || ![TAGS.insertar.izq.join(), TAGS.insertar.der.join()].includes(f.debug.lines.join())) return;
    const side = f.debug.lines.join() === TAGS.insertar.izq.join() ? 'left' : 'right', sp = side === 'left' ? 'izq' : 'der';
    const nx = u.history[i + 1], parent = f.debug.names.raiz, child = find(f.snapshot, parent.id)[side];
    assert.equal(nx.debug.stack.length, f.debug.stack.length + 1, 'la siguiente llamada está un nivel más abajo');
    if (child) assert.equal(nx.debug.names.raiz.name, child.name, 'raiz de la llamada interna = el hijo');
    else assert.equal(nx.debug.names.raiz.slot, `${parent.name}->${sp}`, 'hueco = padre->lado');
    bajadas++;
  });
  assert.ok(bajadas >= 3);
  // rotación: z es el hueco del pivote y al final y ocupa ese hueco; la raíz del subárbol cambia de nombre
  const rr = new AVLTree(); rr.insert(10, null, 'A'); rr.insert(20, null, 'B'); rr.insert(30, null, 'C');
  const rt = rr.history.find(f => f.debug.file === 'rotar_izquierda' && f.debug.lines.join() === TAGS.rotar_izquierda.root.join());
  assert.equal(rt.debug.names.z.name, 'A'); assert.equal(rt.debug.names.y.name, 'B'); assert.equal(rr.root.name, 'B');
  const yz = rr.history.find(f => f.debug.file === 'rotar_izquierda' && f.debug.lines.join() === TAGS.rotar_izquierda.yz.join());
  assert.equal(yz.debug.names.z.name, 'A'); assert.equal(yz.debug.names.y.name, 'B');

  // pila: muestra el nodo de cada llamada (no solo la clave) y minimo()/maximo() bajan con una llamada por nivel
  assert.ok(u.history.some(f => f.debug.stack.some(s => /^insertar_avl\(\w+(->\w+)?, 7\)$/.test(s))));
  const m = new AVLTree(); [40, 20, 60, 10, 30, 5].forEach(k => m.insert(k)); m.findMin();
  assert.ok(Math.max(...m.history.map(f => f.debug.stack.length)) >= 3, 'minimo() recursivo: una llamada por nivel');
  assert.ok(m.history.every(f => f.debug.stack.every(s => s.startsWith('minimo('))));

  // en las líneas que se iluminan NINGUNA variable de nodo se queda sin nombre (salvo en el fotograma final "Fin de …")
  for (const [nombre, ops] of Object.entries({
    insertar: q => { [40, 20, 60, 10, 30, 5, 3, 25, 27].forEach(k => q.insert(k)); },
    eliminar: q => { [40, 20, 60, 10, 30, 5, 50, 70, 3].forEach(k => q.insert(k)); [40, 3, 20, 99, 60, 10].forEach(k => q.delete(k)); },
    consultas: q => { [40, 20, 60, 10].forEach(k => q.insert(k)); q.inorder(); q.preorder(); q.postorder(); q.search(10); q.search(11); q.findMin(); q.findMax(); q.getHeight(); },
  })) {
    const q = new AVLTree(), frames = [];
    q.mute = false;
    // recoger los fotogramas de cada operación
    const wrap = fn => (...a) => { const r0 = fn.apply(q, a); frames.push(...q.history); return r0; };
    for (const fn of ['insert', 'delete', 'inorder', 'preorder', 'postorder', 'search', 'findMin', 'findMax', 'getHeight']) q[fn] = wrap(q[fn]);
    ops(q); sane(frames);
    let checked = 0;
    for (const f of frames) {
      if (!f.debug.stack.length) continue;
      const bind = { ...f.debug.alias, ...f.debug.names };
      for (const li of f.debug.lines) for (const v of NODE_VARS) {
        const raw = CPP_SOURCE[f.debug.file][li];
        if (!new RegExp(`\\b${v}\\b`).test(raw.replace(/"[^"]*"/g, ''))) continue;
        assert.ok(bind[v], `${nombre}: "${v}" sin nombre en ${f.debug.file}:${li} (${f.debug.descripcion})`); checked++;
      }
      // y el HTML no deja la variable original donde sí hay nombre
      for (const li of f.debug.lines) {
        const html = renderCode(CPP_SOURCE[f.debug.file][li], bind).replace(/<span class="np[^>]*>.*?<\/span>/g, '').replace(/<[^>]+>/g, '');
        for (const v of NODE_VARS) if (bind[v]) assert.ok(!new RegExp(`\\b${v}\\b`).test(html), `${nombre}: quedó "${v}" sin reemplazar: ${html}`);
      }
    }
    assert.ok(checked > 20, `${nombre}: solo ${checked} comprobaciones`);
  }
}

console.log(`OK — invariantes AVL/BST, rotaciones sin nodos perdidos y etiquetas de línea válidas (${seen} fotogramas revisados)`);
