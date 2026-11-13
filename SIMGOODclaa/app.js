// ═══════════════════════════════════════════════════════════════
//  Simulador AVL — motor que EJECUTA el algoritmo y graba fotogramas
// ═══════════════════════════════════════════════════════════════
const R = 24, NULL_R = 11, NULL_OFF = 40;

const CODE = {
  rotar_derecha: [
    "void rotar_derecha(unique_ptr<NodoBST<K,V>>& z) {",
    "    auto y = std::move(z->izq);",
    "    z->izq = std::move(y->der);",
    "    actualizar_altura(z);",
    "    y->der = std::move(z);",
    "    z = std::move(y);",
    "    actualizar_altura(z);",
    "    ++contador_rotaciones;",
    "}"],
  rotar_izquierda: [
    "void rotar_izquierda(unique_ptr<NodoBST<K,V>>& z) {",
    "    auto y = std::move(z->der);",
    "    z->der = std::move(y->izq);",
    "    actualizar_altura(z);",
    "    y->izq = std::move(z);",
    "    z = std::move(y);",
    "    actualizar_altura(z);",
    "    ++contador_rotaciones;",
    "}"],
  balancear: [
    "void balancear(unique_ptr<NodoBST<K,V>>& n) {",
    "    actualizar_altura(n);",
    "    int fb = factor_balance(n);",
    "    if (fb > 1) {",
    "        if (factor_balance(n->der) < 0)",
    "            rotar_derecha(n->der);      // caso RL",
    "        rotar_izquierda(n);             // RR (o 2do paso de RL)",
    "    } else if (fb < -1) {",
    "        if (factor_balance(n->izq) > 0)",
    "            rotar_izquierda(n->izq);    // caso LR",
    "        rotar_derecha(n);               // LL (o 2do paso de LR)",
    "    }",
    "}"],
  insertar_avl: [
    "void insertar_avl(unique_ptr<NodoBST<K,V>>& raiz, K clave, V valor) {",
    "    if (!raiz) {",
    "        raiz = make_unique<NodoBST<K,V>>(clave, valor);",
    "        return;",
    "    }",
    "    if (clave < raiz->clave)",
    "        insertar_avl(raiz->izq, clave, valor);",
    "    else if (clave > raiz->clave)",
    "        insertar_avl(raiz->der, clave, valor);",
    "    else {",
    "        raiz->valor = valor;",
    "        return;",
    "    }",
    "    balancear(raiz);",
    "}"],
  eliminar_avl: [
    "void eliminar_avl(unique_ptr<NodoBST<K,V>>& raiz, const K& clave) {",
    "    if (!raiz) return;",
    "    if (clave < raiz->clave)",
    "        eliminar_avl(raiz->izq, clave);",
    "    else if (clave > raiz->clave)",
    "        eliminar_avl(raiz->der, clave);",
    "    else {",
    "        if (!raiz->izq && !raiz->der) raiz = nullptr;        // caso 1",
    "        else if (!raiz->izq) raiz = std::move(raiz->der);    // caso 2a",
    "        else if (!raiz->der) raiz = std::move(raiz->izq);    // caso 2b",
    "        else {                                               // caso 3",
    "            NodoBST* suc = minimo(raiz->der);",
    "            K clave_suc = suc->clave; raiz->clave = clave_suc;",
    "            eliminar_avl(raiz->der, clave_suc);",
    "        }",
    "    }",
    "    if (raiz) balancear(raiz);",
    "}"],
  buscar: [
    "NodoBST* buscar(const unique_ptr<NodoBST<K,V>>& raiz, const K& clave) {",
    "    if (!raiz) return nullptr;",
    "    if (clave == raiz->clave) return raiz.get();",
    "    if (clave < raiz->clave) return buscar(raiz->izq, clave);",
    "    return buscar(raiz->der, clave);",
    "}"],
  minimo: [
    "NodoBST* minimo(const unique_ptr<NodoBST<K,V>>& n) {",
    "    return n->izq ? minimo(n->izq) : n.get();",
    "}"],
};

const STYLES = {
  normal:    { stroke:'#d4d4d4', fill:'#ffffff', text:'#374151' },
  highlight: { stroke:'#fbbf24', fill:'#fef3c7', text:'#78350f', dashed:true },
  purple:    { stroke:'#a78bfa', fill:'#ede9fe', text:'#5b21b6' },
  orange:    { stroke:'#fb923c', fill:'#ffedd5', text:'#9a3412' },
  green:     { stroke:'#4ade80', fill:'#dcfce7', text:'#166534' },
  red:       { stroke:'#f87171', fill:'#fee2e2', text:'#991b1b', dashed:true },
};
const VAR_COL = { z:'#c2410c', n:'#c2410c', raiz:'#c2410c', y:'#6d28d9', suc:'#166534' };

// ───────────── Estado ─────────────
let root = null, nid = 0, ROT = 0;
let T = null;                       // contexto de grabación
let frames = [], cur = 0, playing = false, timer = null;

const mk = k => ({ id: ++nid, k, h: 1, l: null, r: null });
const H = n => n ? n.h : 0;
const FB = n => n ? H(n.r) - H(n.l) : 0;
const upd = n => { if (n) n.h = 1 + Math.max(H(n.l), H(n.r)); };
const slotL = n => ({ get: () => n.l, set: v => { n.l = v; } });
const slotR = n => ({ get: () => n.r, set: v => { n.r = v; } });
const rootSlot = () => ({ get: () => T.root, set: v => { T.root = v; } });
const kk = n => n ? n.k : '∅';
const hi = (...p) => { const o = {}; for (let i = 0; i < p.length; i += 2) if (p[i]) o[p[i].id] = p[i+1]; return o; };

// ───────────── Grabación de fotogramas ─────────────
function snap(fn, line, note, hl, vars) {
  if (T.quiet) return;
  vars = vars || {};
  const seen = new Map();
  const walk = n => { if (!n || seen.has(n.id)) return; seen.set(n.id, n); walk(n.l); walk(n.r); };
  walk(T.root); Object.values(vars).forEach(walk);
  const child = new Set();
  seen.forEach(n => { if (n.l) child.add(n.l.id); if (n.r) child.add(n.r.id); });
  const roots = T.root ? [T.root.id] : [];
  seen.forEach(n => { if (!child.has(n.id) && !roots.includes(n.id)) roots.push(n.id); });
  T.frames.push({
    fn, line: [].concat(line), note, hl: hl || {}, rot: ROT, stack: T.stack.slice(), roots,
    nodes: [...seen.values()].map(n => ({ id:n.id, k:n.k, h:n.h, l:n.l ? n.l.id : null, r:n.r ? n.r.id : null })),
    vars: Object.keys(vars).map(name => ({ name, id: vars[name] ? vars[name].id : null, k: kk(vars[name]) })),
  });
}

// ───────────── Algoritmos (réplica de avl.h) ─────────────
function rotar(s, der) {
  const fn = der ? 'rotar_derecha' : 'rotar_izquierda';
  const A = der ? 'l' : 'r', B = der ? 'r' : 'l', sa = der ? 'izq' : 'der', sb = der ? 'der' : 'izq';
  const zn = s.get(); let y = null;
  const v = () => ({ y, z: s.get() });
  T.stack.push(`${fn}(${zn.k})`);
  snap(fn, 0, `Entramos a <code>${fn}(z)</code> con <code>z</code> = <strong>${zn.k}</strong>. Aún no hemos movido nada.`, hi(zn,'orange'), v());
  y = zn[A]; zn[A] = null;
  snap(fn, 1, `<code>std::move(z->${sa})</code> extrae el subárbol de <strong>${y.k}</strong> y se lo da a <code>y</code>. <code>z->${sa}</code> queda en ∅.`, hi(y,'purple', zn,'orange'), v());
  const t3 = y[B]; zn[A] = t3; y[B] = null;
  snap(fn, 2, `<strong>Línea clave:</strong> <code>y->${sb}</code> (${t3 ? 'nodo <strong>'+t3.k+'</strong>' : '∅'}) pasa a ser <code>z->${sa}</code>. Así ese subárbol no se pierde.`, hi(y,'purple', zn,'orange', t3,'orange'), v());
  upd(zn);
  snap(fn, 3, `<code>actualizar_altura(z)</code>: <strong>${zn.k}</strong> ahora tiene h = <strong>${zn.h}</strong>.`, hi(y,'purple', zn,'highlight'), v());
  y[B] = zn; s.set(null);
  snap(fn, 4, `<strong>⚠ Momento crítico:</strong> <code>y->${sb} = std::move(z)</code>. El ${zn.k} baja como hijo ${sb} de ${y.k}. <code>z</code> queda en ∅ temporalmente.`, hi(y,'purple'), v());
  s.set(y); y = null;
  snap(fn, 5, `<code>z = std::move(y)</code>: el nodo <strong>${s.get().k}</strong> toma el lugar de z. <code>y</code> queda en ∅.`, hi(s.get(),'orange'), v());
  upd(s.get());
  snap(fn, 6, `<code>actualizar_altura(z)</code>: la nueva raíz del subárbol (<strong>${s.get().k}</strong>) tiene h = <strong>${s.get().h}</strong>.`, hi(s.get(),'highlight'), v());
  ROT++;
  snap(fn, 7, `<code>++contador_rotaciones</code> → ahora vale <strong>${ROT}</strong>.`, hi(s.get(),'highlight'), v());
  snap(fn, 8, `Fin de la rotación. El orden inorden del BST se mantiene.`, hi(s.get(),'green'), v());
  T.stack.pop();
}

function balancear(s) {
  const n = s.get(), fn = 'balancear';
  T.stack.push(`balancear(${n.k})`);
  upd(n);
  snap(fn, 1, `<code>actualizar_altura(n)</code>: h(<strong>${n.k}</strong>) = 1 + max(${H(n.l)}, ${H(n.r)}) = <strong>${n.h}</strong>.`, hi(n,'highlight'), { n });
  const fb = FB(n);
  const bad = Math.abs(fb) > 1;
  snap(fn, 2, `fb = h(der) − h(izq) = ${H(n.r)} − ${H(n.l)} = <strong>${fb}</strong>. ${bad ? '¡<strong>Desbalanceado</strong> (|fb| &gt; 1)!' : 'Está dentro de {−1, 0, 1}.'}`, hi(n, bad ? 'red' : 'green'), { n });
  if (fb > 1) {
    const c = n.r, rl = FB(c) < 0;
    snap(fn, [3,4], `Pesado a la derecha. fb del hijo der (${c.k}) = ${FB(c)} → ${rl ? '<strong>caso RL</strong>: primero se rota el hijo derecho.' : '<strong>caso RR</strong>: basta una rotación a la izquierda.'}`, hi(n,'red', c,'purple'), { n });
    if (rl) { snap(fn, 5, `Se llama <code>rotar_derecha(n->der)</code> sobre el nodo ${c.k}.`, hi(c,'purple'), { n }); rotar(slotR(n), true); }
    snap(fn, 6, `Se llama <code>rotar_izquierda(n)</code> sobre el nodo ${s.get().k}.`, hi(s.get(),'orange'), { n: s.get() });
    rotar(s, false);
  } else if (fb < -1) {
    const c = n.l, lr = FB(c) > 0;
    snap(fn, [7,8], `Pesado a la izquierda. fb del hijo izq (${c.k}) = ${FB(c)} → ${lr ? '<strong>caso LR</strong>: primero se rota el hijo izquierdo.' : '<strong>caso LL</strong>: basta una rotación a la derecha.'}`, hi(n,'red', c,'purple'), { n });
    if (lr) { snap(fn, 9, `Se llama <code>rotar_izquierda(n->izq)</code> sobre el nodo ${c.k}.`, hi(c,'purple'), { n }); rotar(slotL(n), false); }
    snap(fn, 10, `Se llama <code>rotar_derecha(n)</code> sobre el nodo ${s.get().k}.`, hi(s.get(),'orange'), { n: s.get() });
    rotar(s, true);
  } else {
    snap(fn, [3,7,11,12], `|fb| ≤ 1: no se necesita rotar. El nodo ${n.k} queda igual.`, hi(n,'green'), { n });
  }
  T.stack.pop();
}

function insertar(s, k) {
  const fn = 'insertar_avl', n = s.get();
  T.stack.push(`insertar_avl(${kk(n)}, ${k})`);
  snap(fn, 0, `Entramos con <code>raiz</code> = ${n ? '<strong>'+n.k+'</strong>' : '∅'} y clave = <strong>${k}</strong>.`, hi(n,'orange'), { raiz: n });
  if (!n) {
    snap(fn, 1, `<code>raiz</code> es <code>nullptr</code>: encontramos el hueco donde va la clave ${k}.`, {}, { raiz: null });
    const nn = mk(k); s.set(nn);
    snap(fn, [2,3], `Se crea el nodo hoja <strong>${k}</strong> (h = 1) y se hace <code>return</code>: una hoja nunca está desbalanceada.`, hi(nn,'green'), { raiz: nn });
    T.stack.pop(); return;
  }
  if (k < n.k) { snap(fn, [5,6], `${k} &lt; ${n.k} → bajamos por el subárbol <strong>izquierdo</strong>.`, hi(n,'orange'), { raiz: n }); insertar(slotL(n), k); }
  else if (k > n.k) { snap(fn, [5,7,8], `${k} &gt; ${n.k} → bajamos por el subárbol <strong>derecho</strong>.`, hi(n,'orange'), { raiz: n }); insertar(slotR(n), k); }
  else { snap(fn, [5,7,9,10,11], `La clave ${k} ya existe: solo se actualiza el valor. El árbol no cambia.`, hi(n,'green'), { raiz: n }); T.stack.pop(); return; }
  snap(fn, 13, `Regresamos de la recursión: se reequilibra el nodo <strong>${s.get().k}</strong> con <code>balancear</code>.`, hi(s.get(),'orange'), { raiz: s.get() });
  balancear(s);
  T.stack.pop();
}

function minimo(n) {
  T.stack.push(`minimo(${n.k})`);
  const hasL = !!n.l;
  snap('minimo', 1, hasL ? `${n.k} tiene hijo izquierdo → seguimos bajando por la izquierda.` : `${n.k} no tiene hijo izquierdo: es el <strong>mínimo</strong>.`, hi(n, hasL ? 'orange' : 'green'), { n });
  const r = hasL ? minimo(n.l) : n;
  T.stack.pop(); return r;
}

function eliminar(s, k) {
  const fn = 'eliminar_avl', n = s.get();
  T.stack.push(`eliminar_avl(${kk(n)}, ${k})`);
  if (!n) { snap(fn, 1, `<code>raiz</code> es ∅: la clave ${k} no existe. No hay nada que hacer.`, {}, { raiz: null }); T.stack.pop(); return; }
  if (k < n.k) { snap(fn, [2,3], `${k} &lt; ${n.k} → buscamos en el subárbol izquierdo.`, hi(n,'orange'), { raiz: n }); eliminar(slotL(n), k); }
  else if (k > n.k) { snap(fn, [4,5], `${k} &gt; ${n.k} → buscamos en el subárbol derecho.`, hi(n,'orange'), { raiz: n }); eliminar(slotR(n), k); }
  else {
    snap(fn, 6, `Encontramos el nodo <strong>${k}</strong> a eliminar.`, hi(n,'red'), { raiz: n });
    if (!n.l && !n.r) {
      snap(fn, 7, `<strong>Caso 1</strong>: es una hoja → se elimina directamente.`, hi(n,'red'), { raiz: n });
      s.set(null);
      snap(fn, 7, `<code>raiz = nullptr</code>: el nodo ${k} desapareció.`, {}, { raiz: null });
    } else if (!n.l) {
      snap(fn, 8, `<strong>Caso 2a</strong>: solo tiene hijo derecho (${n.r.k}) → el hijo ocupa su lugar.`, hi(n,'red', n.r,'purple'), { raiz: n });
      s.set(n.r);
      snap(fn, 8, `El nodo ${n.r.k} sube a la posición del ${k}.`, hi(s.get(),'purple'), { raiz: s.get() });
    } else if (!n.r) {
      snap(fn, 9, `<strong>Caso 2b</strong>: solo tiene hijo izquierdo (${n.l.k}) → el hijo ocupa su lugar.`, hi(n,'red', n.l,'purple'), { raiz: n });
      s.set(n.l);
      snap(fn, 9, `El nodo ${n.l.k} sube a la posición del ${k}.`, hi(s.get(),'purple'), { raiz: s.get() });
    } else {
      snap(fn, 10, `<strong>Caso 3</strong>: tiene dos hijos → se usa el sucesor inorden (mínimo del subárbol derecho).`, hi(n,'red'), { raiz: n });
      snap(fn, 11, `Se llama <code>minimo(raiz->der)</code>.`, hi(n,'red', n.r,'orange'), { raiz: n });
      const suc = minimo(n.r);
      snap(fn, 11, `El sucesor es <strong>${suc.k}</strong>.`, hi(n,'red', suc,'green'), { raiz: n, suc });
      const ks = suc.k; n.k = ks;
      snap(fn, 12, `Se copia la clave del sucesor: el nodo ahora vale <strong>${ks}</strong> (temporalmente hay dos ${ks}).`, hi(n,'orange', suc,'green'), { raiz: n, suc });
      snap(fn, 13, `Se elimina el sucesor del subárbol derecho con <code>eliminar_avl(raiz->der, ${ks})</code>.`, hi(suc,'red'), { raiz: n, suc });
      eliminar(slotR(n), ks);
    }
  }
  if (s.get()) {
    snap(fn, 16, `Al regresar: <code>balancear(raiz)</code> sobre el nodo <strong>${s.get().k}</strong>.`, hi(s.get(),'orange'), { raiz: s.get() });
    balancear(s);
  } else snap(fn, 16, `La raíz quedó vacía: no se llama a <code>balancear</code>.`, {}, { raiz: null });
  T.stack.pop();
}

function buscar(n, k) {
  const fn = 'buscar';
  T.stack.push(`buscar(${kk(n)}, ${k})`);
  if (!n) { snap(fn, 1, `<code>raiz</code> es ∅ → la clave ${k} <strong>no existe</strong>. Retorna <code>nullptr</code>.`, {}, { raiz: null }); T.stack.pop(); return null; }
  if (k === n.k) { snap(fn, 2, `${k} == ${n.k} → <strong>¡encontrado!</strong> Retorna el puntero al nodo.`, hi(n,'green'), { raiz: n }); T.stack.pop(); return n; }
  const left = k < n.k;
  snap(fn, left ? 3 : 4, `${k} ${left ? '&lt;' : '&gt;'} ${n.k} → buscamos a la <strong>${left ? 'izquierda' : 'derecha'}</strong>.`, hi(n,'orange'), { raiz: n });
  const r = buscar(left ? n.l : n.r, k);
  T.stack.pop(); return r;
}

function findSlot(k) {
  let s = rootSlot();
  while (s.get()) {
    const n = s.get();
    if (k === n.k) return s;
    s = k < n.k ? slotL(n) : slotR(n);
  }
  return null;
}

// ───────────── Inorden y validación ─────────────
const inorden = (n, a = []) => { if (n) { inorden(n.l, a); a.push(n.k); inorden(n.r, a); } return a; };
const esAVL = n => { if (!n) return true; return Math.abs(FB(n)) <= 1 && esAVL(n.l) && esAVL(n.r); };

// ───────────── Render ─────────────
function layout(f) {
  const map = {}; f.nodes.forEach(n => map[n.id] = n);
  let idx = 0, maxD = 0;
  const go = (id, d) => {
    if (id === null || !map[id]) return;
    const n = map[id];
    go(n.l, d + 1); n.ix = idx++; n.d = d; maxD = Math.max(maxD, d); go(n.r, d + 1);
  };
  f.roots.forEach((r, i) => { if (i) idx += 0.8; go(r, 0); });
  const span = Math.max(idx - 1, 1);
  const dx = Math.min(64, 720 / span), off = (800 - span * dx) / 2;
  f.nodes.forEach(n => { n.x = off + n.ix * dx; n.y = 60 + n.d * 85; });
  return { map, h: 60 + maxD * 85 + 70 };
}

function renderTree(f, prev) {
  const { map, h } = layout(f);
  const prevH = {}; if (prev) prev.nodes.forEach(n => prevH[n.id] = n.h);
  const showNull = f.nodes.length <= 12;
  let e = '', nl = '', nd = '', tg = '';
  f.nodes.forEach(n => {
    ['l','r'].forEach(side => {
      const c = n[side] !== null ? map[n[side]] : null;
      if (c) {
        const dx = c.x - n.x, dy = c.y - n.y, d = Math.hypot(dx, dy), ux = dx/d, uy = dy/d;
        e += `<line x1="${n.x+ux*R}" y1="${n.y+uy*R}" x2="${c.x-ux*R}" y2="${c.y-uy*R}" stroke="#cbd5e1" stroke-width="1.5"/>`;
      } else if (showNull) {
        const sx = side === 'l' ? -1 : 1, nx = n.x + sx * NULL_OFF, ny = n.y + NULL_OFF + 4;
        const d = Math.hypot(sx*NULL_OFF, NULL_OFF+4), ux = sx*NULL_OFF/d, uy = (NULL_OFF+4)/d;
        nl += `<line x1="${n.x+ux*R}" y1="${n.y+uy*R}" x2="${nx-ux*NULL_R}" y2="${ny-uy*NULL_R}" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="4 3"/>
          <circle cx="${nx}" cy="${ny}" r="${NULL_R}" fill="#f9fafb" stroke="#cbd5e1" stroke-dasharray="3 2"/>
          <text x="${nx}" y="${ny}" fill="#9ca3af" font-size="12" text-anchor="middle" dominant-baseline="central">∅</text>`;
      }
    });
  });
  f.nodes.forEach(n => {
    const s = STYLES[f.hl[n.id]] || STYLES.normal;
    const fb = (n.r !== null ? map[n.r].h : 0) - (n.l !== null ? map[n.l].h : 0);
    const changed = prev && prevH[n.id] !== undefined && prevH[n.id] !== n.h;
    nd += `<g><circle cx="${n.x}" cy="${n.y}" r="${R}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="2" ${s.dashed ? 'stroke-dasharray="4 3"' : ''}/>
      <text x="${n.x}" y="${n.y}" fill="${s.text}" font-size="14" font-weight="600" text-anchor="middle" dominant-baseline="central">${n.k}</text>
      ${changed ? `<rect x="${n.x-17}" y="${n.y-R-22}" width="34" height="15" rx="3" fill="#fef3c7" stroke="#fbbf24" stroke-width=".8"/>` : ''}
      <text x="${n.x}" y="${n.y-R-12}" fill="${changed ? '#b45309' : '#9ca3af'}" font-size="11" font-weight="${changed ? 700 : 500}" text-anchor="middle" dominant-baseline="central">h=${n.h}</text>
      <text x="${n.x}" y="${n.y+R+12}" fill="${Math.abs(fb) > 1 ? '#dc2626' : '#b0b7c3'}" font-size="10" font-weight="${Math.abs(fb) > 1 ? 700 : 400}" text-anchor="middle" dominant-baseline="central">fb=${fb}</text></g>`;
  });
  const cnt = {};
  f.vars.forEach(v => {
    if (v.id === null || !map[v.id]) return;
    const n = map[v.id], i = cnt[v.id] = (cnt[v.id] || 0) + 1, c = VAR_COL[v.name] || '#6b7280';
    const bx = n.x - R - 8 - 26 * i;
    tg += `<g><line x1="${bx+24}" y1="${n.y}" x2="${n.x-R-1}" y2="${n.y}" stroke="${c}" stroke-width="1.5"/>
      <rect x="${bx}" y="${n.y-9}" width="24" height="18" rx="4" fill="#fff" stroke="${c}"/>
      <text x="${bx+12}" y="${n.y}" fill="${c}" font-size="11" font-weight="700" text-anchor="middle" dominant-baseline="central">${v.name}</text></g>`;
  });
  if (!f.nodes.length) nd = `<text x="400" y="${h/2}" fill="#9ca3af" font-size="14" text-anchor="middle">Árbol vacío — inserta una clave arriba</text>`;
  return `<svg viewBox="0 0 800 ${Math.max(h, 180)}" font-family="'Fira Code', monospace">${e}${nl}${nd}${tg}</svg>`;
}

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const $ = id => document.getElementById(id);

function renderFrame() {
  const f = frames[cur];
  const code = CODE[f.fn];
  $('codePanel').innerHTML = code
    ? `<div class="code-title">${f.fn}</div>` + code.map((l, i) => `<div class="code-line${f.line.includes(i) ? ' active' : ''}">${esc(l)}</div>`).join('')
    : `<div class="code-title">—</div><div class="code-line" style="color:#9ca3af">Elige una operación para ver el código ejecutándose línea por línea.</div>`;
  $('stackBar').innerHTML = (f.stack.length ? '<b>Pila:</b> ' + f.stack.map(esc).join(' › ') : '<b>Pila:</b> (vacía)') + `<span class="rot">Rotaciones: ${f.rot}</span>`;
  $('varsBar').innerHTML = f.vars.length ? f.vars.map(v => `<span class="chip" style="border-color:${VAR_COL[v.name]||'#9ca3af'};color:${VAR_COL[v.name]||'#6b7280'}">${v.name} → ${v.id === null ? '∅' : v.k}</span>`).join('') : '';
  $('treePanel').innerHTML = renderTree(f, cur ? frames[cur-1] : null);
  $('notePanel').innerHTML = f.note ? `<div class="note">${f.note}</div>` : '';
  $('frameNum').textContent = cur + 1; $('frameTotal').textContent = frames.length;
  const p = $('progress'); p.max = frames.length - 1; p.value = cur;
  $('prevBtn').disabled = cur === 0; $('nextBtn').disabled = cur === frames.length - 1;
  $('frameList').innerHTML = frames.map((fr, i) => `<button class="fchip${i === cur ? ' on' : ''}" onclick="jumpTo(${i})" title="${esc(fr.note.replace(/<[^>]+>/g,''))}">${i+1}<small>${fr.fn ? fr.fn.replace('_avl','').replace('rotar_','rot_') : 'estado'}</small></button>`).join('');
  const on = $('frameList').querySelector('.on'); if (on) on.scrollIntoView({ block:'nearest', inline:'center' });
}

// ───────────── Navegación ─────────────
function stop() { clearInterval(timer); playing = false; $('playIcon').textContent = '▶'; $('playLabel').textContent = 'Reproducir'; }
function jumpTo(i) { cur = i; renderFrame(); }
function next() { if (cur < frames.length - 1) jumpTo(cur + 1); }
function prev() { if (cur > 0) jumpTo(cur - 1); }
function togglePlay() {
  if (playing) return stop();
  playing = true; $('playIcon').textContent = '⏸'; $('playLabel').textContent = 'Pausar';
  if (cur >= frames.length - 1) jumpTo(0);
  timer = setInterval(() => { if (cur >= frames.length - 1) stop(); else next(); }, +$('speed').value);
}
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
  if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev();
});

// ───────────── Operaciones de la UI ─────────────
function msg(t, err) { const m = $('msg'); m.textContent = t || ''; m.className = err ? 'err' : ''; }
function begin(quiet) { T = { root, frames: [], stack: [], quiet: !!quiet }; }
function finish(note) {
  if (!T.quiet) {
    const last = T.frames.length ? T.frames[T.frames.length - 1].fn : '';
    snap(last, [], note + `<br>Inorden: <code>${inorden(T.root).join(', ') || '—'}</code> · ${esc(esAVL(T.root) ? 'Árbol AVL válido ✔' : 'El árbol NO es AVL')}.`, {}, {});
  }
  root = T.root;
  if (!T.quiet) { stop(); frames = T.frames; cur = 0; renderFrame(); }
}
function showState(note) { begin(); finish(note); }

function getKey() {
  const v = $('keyInput').value.trim();
  if (v === '' || isNaN(+v) || !Number.isInteger(+v)) { msg('Escribe una clave entera.', true); return null; }
  msg(''); return +v;
}
function op(name) {
  const k = getKey(); if (k === null) return;
  begin();
  if (name === 'insertar') { if (findSlot(k)) { /* se muestra igual: clave repetida */ } insertar(rootSlot(), k); finish(`✅ <code>insertar_avl</code> terminó con la clave ${k}.`); }
  else if (name === 'eliminar') { const ex = !!findSlot(k); eliminar(rootSlot(), k); finish(ex ? `✅ <code>eliminar_avl</code> terminó: ${k} eliminado.` : `La clave ${k} no estaba en el árbol.`); }
  else if (name === 'buscar') { const r = buscar(T.root, k); finish(r ? `✅ La clave ${k} <strong>sí está</strong> en el árbol.` : `La clave ${k} <strong>no está</strong> en el árbol.`); }
  else if (name === 'minimo') {
    if (!T.root) { msg('El árbol está vacío.', true); return; }
    const m = minimo(T.root); snap('minimo', [], `El mínimo del árbol es <strong>${m.k}</strong>.`, hi(m,'green'), { n: m }); finish('✅ <code>minimo</code> terminó.');
  } else {
    const s = findSlot(k);
    if (!s) { msg(`La clave ${k} no está en el árbol.`, true); return; }
    const n = s.get();
    if (name === 'rotar_derecha' && !n.l) { msg(`No se puede: ${k} no tiene hijo izquierdo (z->izq sería nullptr).`, true); return; }
    if (name === 'rotar_izquierda' && !n.r) { msg(`No se puede: ${k} no tiene hijo derecho (z->der sería nullptr).`, true); return; }
    if (name === 'balancear') balancear(s); else rotar(s, name === 'rotar_derecha');
    finish(`✅ <code>${name}</code> terminó sobre el nodo ${k}.`);
  }
}
function quickInsert() {
  const ks = $('multiInput').value.split(/[\s,;]+/).filter(Boolean).map(Number);
  if (!ks.length || ks.some(x => !Number.isInteger(x))) { msg('Escribe enteros separados por comas.', true); return; }
  msg(''); begin(true); ks.forEach(k => insertar(rootSlot(), k)); root = T.root;
  showState(`Se insertaron rápido: <code>${ks.join(', ')}</code> (sin fotogramas). Ahora prueba una operación para verla paso a paso.`);
}
function randomTree() { const s = new Set(); while (s.size < 8) s.add(1 + Math.floor(Math.random() * 99)); $('multiInput').value = [...s].join(', '); clearTree(true); quickInsert(); }
function clearTree(silent) { root = null; ROT = 0; if (!silent) { msg(''); showState('Árbol vacío.'); } }
function loadExample() {
  root = null; ROT = 0; begin(true); [50,30,70,20,40].forEach(k => insertar(rootSlot(), k)); root = T.root;
  $('keyInput').value = 10;
  showState('Ejemplo del caso <strong>LL</strong>: el árbol tiene 50, 30, 70, 20, 40. Pulsa <strong>Insertar</strong> con la clave <strong>10</strong> y verás cómo se desbalancea el 50 y se llama a <code>rotar_derecha</code>.');
}

$('keyInput').addEventListener('keydown', e => { if (e.key === 'Enter') op('insertar'); });
$('multiInput').addEventListener('keydown', e => { if (e.key === 'Enter') quickInsert(); });
loadExample();
