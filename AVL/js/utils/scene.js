// js/utils/scene.js — frame -> escena (buildScene) y animación entre escenas (blend)
import { TreeLayout } from './layout.js';

export const W = 150, H = 80, SC = 24;   // SC = centro de la casilla izq/der
// Conector ortogonal: baja, avanza en horizontal y vuelve a bajar (esquinas de 90°)
const curve = (x1, y1, x2, y2) => { const m = (y1 + y2) / 2; return Math.abs(x1 - x2) < 1 ? `M ${x1} ${y1} V ${y2}` : `M ${x1} ${y1} V ${m} H ${x2} V ${y2}`; };

// Indicador de giro: corchete de ángulos rectos pegado al costado del pivote.
// Nace en el borde del nodo (punto) y vuelve a tocarlo con la punta: derecha = horario, izquierda = antihorario.
const arc = (x, y, dir) => {
  const s = dir === 'right' ? 1 : -1, x0 = dir === 'right' ? x + W : x, x1 = x0 + s * 20;
  return `M ${x0} ${y + 34} H ${x1} V ${y + H - 10} H ${x0 + s * 1}`;
};

// Convierte un frame (snapshot) en nodos, flechas y cajas listos para pintar
export function buildScene(f) {
  const d = f.debug, rot = d.file.startsWith('rotar');
  const nodes = [], edges = [], boxes = [], names = {};
  for (const [nm, v] of Object.entries(f.memoria || {})) if (v.id) (names[v.id] ??= []).push(nm);
  let arcInfo = null;
  const add = (root, ox, oy, floating) => {
    const L = TreeLayout.calculatePositions(root, W, H);
    const walk = (n, par) => {
      const p = L.treePositions[n.id], x = p.x + ox, y = p.y + oy, active = n.id === d.activeNodeId;
      nodes.push({ ...n, x, y, floating, active, parent: par, vars: names[n.id] || [], isRoot: !floating && n === root });
      if (rot && n.id === d.pivot) arcInfo = { id: n.id, dir: d.dir };
      for (const [side, c] of [['left', n.left], ['right', n.right]]) if (c) {
        edges.push({ id: '>' + c.id, rot, a: n.id, b: c.id, side, hot: !!d.hot?.includes(c.id) });
        walk(c, n.id);
      }
    };
    if (root) walk(root);
    return L;
  };
  const main = add(f.snapshot, 0, 0, false);
  let fy = 10;
  for (const [name, root] of Object.entries(f.floatingSnapshots || {})) {
    const L = TreeLayout.calculatePositions(root, W, H), fx = main.totalWidth + 80;
    const w = Math.max(L.totalWidth + 40, 170), h = (L.maxDepth + 1) * (H + 55) + 55;
    boxes.push({ name, x: fx - 15, y: fy, w, h });
    add(root, fx, fy + 38, true);
    fy += h + 20;
  }
  return { nodes, edges, boxes, arc: arcInfo,
           w: Math.max(0, ...nodes.map(n => n.x + W)), h: Math.max(0, ...nodes.map(n => n.y + H + 20)) };
}

const ease = t => 1 - (1 - t) ** 3;   // easeOutCubic: arranca rápido y aterriza suave

// Mezcla la escena anterior (from = posiciones dibujadas, prev = escena previa) con la nueva (sc).
// Nodos Y flechas salen de las mismas posiciones interpoladas, así se mueven juntos.
export function blend(sc, from, prev, t) {
  const k = ease(t), pos = new Map(), nodes = [], edges = [];
  const cur = new Set(sc.nodes.map(n => n.id));
  for (const n of sc.nodes) {                      // nodos que quedan o entran (salen del padre)
    const f = from.get(n.id) ?? from.get(n.parent) ?? n, enter = !from.has(n.id);
    const p = { x: f.x + (n.x - f.x) * k, y: f.y + (n.y - f.y) * k };
    pos.set(n.id, p);
    nodes.push({ ...n, ...p, o: enter ? k : 1 });
  }
  for (const [id, n] of prev.nodes) if (t < 1 && !cur.has(id)) {   // nodos que se van: se desvanecen
    const f = from.get(id) ?? n;
    pos.set(id, { x: f.x, y: f.y });
    nodes.push({ ...n, x: f.x, y: f.y, o: 1 - k });
  }
  // Flechas: una por hijo (clave '>hijo'). Salen de la casilla izq/der del padre.
  // Si un hijo cambia de padre, el ORIGEN de la flecha se desliza del padre viejo al nuevo.
  const tail = (p, side) => ({ x: p.x + (side === 'left' ? SC : W - SC), y: p.y + H });
  const fin = new Map(sc.nodes.map(n => [n.id, n])), prevE = new Map(prev.edges.map(e => [e.id, e]));
  const mk = (e, o, t0) => {
    const a = pos.get(e.a), b = pos.get(e.b); if (!a || !b) return null;
    let t = tail(a, e.side), moved = false;
    if (t0) { const t1 = tail(fin.get(e.a) ?? a, e.side); t = { x: t0.x + (t1.x - t0.x) * k, y: t0.y + (t1.y - t0.y) * k }; moved = k < 1; }
    return { id: e.id, rot: e.rot, hot: e.hot, moved, o, d: curve(t.x, t.y, b.x + W / 2, b.y - 3) };
  };
  for (const e of sc.edges) {
    const pe = prevE.get(e.id), changed = pe && (pe.a !== e.a || pe.side !== e.side);
    const t0 = changed ? tail(from.get(pe.a) ?? pos.get(pe.a) ?? pos.get(e.a), pe.side) : null;
    edges.push(mk(e, pe ? 1 : k, t0));
  }
  const curE = new Set(sc.edges.map(e => e.id));
  for (const e of prev.edges) if (t < 1 && !curE.has(e.id)) edges.push(mk(e, 1 - k));
  const ap = sc.arc && pos.get(sc.arc.id);
  return { nodes, edges: edges.filter(Boolean), arc: ap ? arc(ap.x, ap.y, sc.arc.dir) : null };
}
