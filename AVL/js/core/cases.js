// js/core/cases.js — casos de la guía (avl_main.cpp: P1–P6 y extras P7–P8) + árbol de ejemplo.
// Cada caso arma el árbol en silencio (build), ejecuta la operación grabando fotogramas (keys)
// y comprueba lo mismo que los assert() de avl_main.cpp.
const seq = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const has = (t, k) => { let n = t.root; while (n) { if (k === n.key) return true; n = k < n.key ? n.left : n.right; } return false; };
const alt = t => t.height(t.root);

export const CASES = [
  { id: 'P1', title: 'P1 · Inserción simple (RR)', op: 'insert', build: [], keys: [10, 20, 30],
    about: 'Tres claves ordenadas: un BST daría altura 3; el AVL rota (RR → rotar_izquierda).',
    expect: 'raíz 20 · altura 2 · 1 rotación', check: t => t.root.key === 20 && alt(t) === 2 && t.rotations === 1 },
  { id: 'P2', title: 'P2 · Caso LR (rotación doble)', op: 'insert', build: [], keys: [30, 10, 20],
    about: 'El 20 queda en zigzag: primero rotar_izquierda(n->izq), luego rotar_derecha(n).',
    expect: 'raíz 20 · altura 2 · 2 rotaciones simples', check: t => t.root.key === 20 && alt(t) === 2 && t.rotations === 2 },
  { id: 'P3', title: 'P3 · Inserción ordenada 1..15', op: 'insert', build: [], keys: seq(1, 15),
    about: 'Un BST degeneraría en una lista (altura 15); el AVL se mantiene logarítmico.',
    expect: 'altura ≤ 4 · existe el 8', check: t => alt(t) <= 4 && has(t, 8) },
  { id: 'P4', title: 'P4 · Eliminar hoja', op: 'delete', build: [20, 10, 30], keys: [10],
    about: 'Se parte de 20, 10, 30 y se elimina la hoja izquierda.',
    expect: 'el 10 ya no está · altura ≤ 2', check: t => !has(t, 10) && alt(t) <= 2 },
  { id: 'P5', title: 'P5 · Eliminar raíz con dos hijos', op: 'delete', build: [20, 10, 30, 25, 35], keys: [20],
    about: 'Caso 3: la raíz copia la clave de su sucesor inorden y se elimina el sucesor original.',
    expect: 'el 20 ya no está · altura ≤ 3', check: t => !has(t, 20) && alt(t) <= 3 },
  { id: 'P6', title: 'P6 · Eliminar de 1..7', op: 'delete', build: seq(1, 7), keys: [1],
    about: 'Se insertan 1..7 y se elimina el 1: balancear() se llama en el camino de vuelta, pero aquí no hace falta rotar.',
    expect: 'la altura no aumenta', check: (t, c) => alt(t) <= c.hBefore },
  { id: 'P7', title: 'P7 · Caso LL (extra)', op: 'insert', build: [], keys: [30, 20, 10],
    about: 'Desbalance recto a la izquierda: una rotar_derecha.',
    expect: 'raíz 20 · altura 2 · 1 rotación', check: t => t.root.key === 20 && alt(t) === 2 && t.rotations === 1 },
  { id: 'P8', title: 'P8 · Caso RL (extra)', op: 'insert', build: [], keys: [10, 30, 20],
    about: 'Zigzag a la derecha: rotar_derecha(n->der) y luego rotar_izquierda(n).',
    expect: 'raíz 20 · altura 2 · 2 rotaciones simples', check: t => t.root.key === 20 && alt(t) === 2 && t.rotations === 2 },
];

// Devuelve { frames, ok }: los fotogramas de la operación y si se cumple lo que comprueba avl_main.cpp
export function applyCase(tree, c) {
  tree.clear();
  tree.mute = true;
  try { c.build.forEach(k => tree.insert(k)); } finally { tree.mute = false; }
  const hBefore = alt(tree);
  tree.batch(c.keys, c.op === 'delete' ? k => tree.delete(k) : k => tree.insert(k));
  return { frames: tree.history, ok: !!c.check(tree, { hBefore }) };
}

// Árbol de ejemplo (7 nodos, perfecto). Devuelve los fotogramas a mostrar (un solo paso informativo).
export function loadExample(tree) {
  tree.clear();
  tree.mute = true;
  try { [40, 20, 60, 10, 30, 50, 70].forEach(k => tree.insert(k)); } finally { tree.mute = false; }
  tree.history = [];
  tree.rec('insertar', 'call', 'Árbol de ejemplo cargado (7 nodos). Prueba insertar 5 y luego 3.');
  return tree.history;
}
