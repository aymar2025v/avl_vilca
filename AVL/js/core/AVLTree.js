// js/core/AVLTree.js — AVL con grabación de fotogramas (debugger paso a paso)
// Cada fotograma dice: qué función C++ corre, QUÉ LÍNEAS (por etiqueta), qué variables
// locales existen y qué punteros se acaban de reasignar (hot). Los huecos del árbol se
// modifican con set(v), igual que C++ modifica el unique_ptr<Nodo>& que recibe.
//
// v9 · NOMBRES: cada nodo tiene un nombre único (A, B …). Cada fotograma lleva además
//   debug.names → a qué nodo (o hueco, p. ej. "A->izq") apunta cada variable del C++ EN ESA LÍNEA
//   debug.alias → lo mismo, pero con el primer valor que tuvo cada variable en esa llamada
//                 (sirve para variables que aún no se han asignado en la línea que se muestra)
// El panel de código los usa para escribir "B->izq" donde el C++ dice "raiz->izq".
import { Node } from './Node.js';
import { TAGS } from '../utils/cpp_source.js';
import { nameSet, suggestNames, validateName } from '../utils/names.js';

const SP = { left: 'izq', right: 'der' };
export const MAX_ANIMATED = 32;   // con más claves en un lote solo se anima la última operación
const S = label => ({ slot: label });   // hueco vacío (nullptr) con su nombre: "A->izq", o "raiz" si es la raíz del árbol

export class AVLTree {
  constructor() { this.root = null; this.history = []; this.stack = []; this.acts = []; this.rotations = 0; this._skip = false; this.mute = false; }

  // ── utilidades ──────────────────────────────────────────────────
  clear() { this.root = null; this.history = []; this.stack = []; this.acts = []; this.rotations = 0; this._skip = false; this.mute = false; }
  size(n = this.root) { return n ? 1 + this.size(n.left) + this.size(n.right) : 0; }
  has(k) { let n = this.root; while (n) { if (k === n.key) return true; n = k < n.key ? n.left : n.right; } return false; }
  names(n = this.root, out = []) { if (n) { out.push(n.name); this.names(n.left, out); this.names(n.right, out); } return out; }
  _autoName() { return suggestNames(nameSet(this.names()), 1)[0]; }
  // Ejecuta fn(clave) para cada clave y concatena los fotogramas. Con muchas claves solo se graba la
  // última operación (las demás corren en silencio, sin fotos del árbol) para no gastar memoria.
  batch(keys, fn, maxAnimated = MAX_ANIMATED) {
    const all = [], animate = keys.length <= maxAnimated;
    keys.forEach((k, i) => {
      const record = animate || i === keys.length - 1;
      this.mute = !record;
      try { fn(k); } finally { this.mute = false; }
      if (record) all.push(...this.history);
    });
    this.history = all;
  }

  height(n)  { return n ? n.height : 0; }
  fb(n)      { return n ? this.height(n.right) - this.height(n.left) : 0; }
  upd(n)     { if (n) n.height = 1 + Math.max(this.height(n.left), this.height(n.right)); }

  // ── pila de llamadas: cada llamada es una "activación" con su propio mapa de alias ──
  _push(label) { this.stack.push(label); this.acts.push({}); }
  _pop()       { this.stack.pop(); this.acts.pop(); }

  // ── fotogramas ──────────────────────────────────────────────────
  rec(file, tag, desc, node = null, action = 'none', o = {}) {
    if (this.mute) return;
    const lines = TAGS[file]?.[tag];
    if (!lines) throw new Error(`Etiqueta desconocida: ${file}:${tag}`);
    const mem = {}, names = {}, act = this.acts.at(-1) ?? {};
    const ref = v => ({ name: v.name, hue: v.hue, key: v.key, id: v.id });
    for (const [k, v] of Object.entries(o.vars || {})) if (v) {
      if (v.slot !== undefined) { mem[k] = { slot: v.slot }; names[k] = { slot: v.slot }; }
      else if (v.plain) mem[k] = { key: v.key, plain: true };
      else { mem[k] = { ...ref(v), plain: false }; names[k] = ref(v); }
    }
    // names: lo que cada variable "vale" al EJECUTAR la línea (antes de que se reasigne), si difiere de vars
    for (const [k, v] of Object.entries(o.names || {})) if (v) names[k] = ref(v);
    for (const [k, v] of Object.entries(names)) act[k] ??= v;
    const fl = {};
    for (const [k, v] of Object.entries(o.float || {})) if (v) fl[k] = this._snap(v);
    this.history.push({
      debug: { file, lineIndex: lines[0], lines, descripcion: desc, activeNodeId: node?.id ?? null,
               action, detail: !!o.detail, hot: o.hot || [], caso: o.caso || null, pivot: o.pivot || null, dir: o.dir || null,
               stack: [...this.stack], names, alias: act },
      memoria: mem, snapshot: this._snap(this.root), floatingSnapshots: fl, rot: this.rotations
    });
  }
  _begin() { this.history = []; this.stack = []; this.acts = []; this._skip = false; }
  _snap(n) {
    return !n ? null : { id: n.id, name: n.name, hue: n.hue, key: n.key, value: n.value, height: n.height, fb: this.fb(n),
                         left: this._snap(n.left), right: this._snap(n.right) };
  }

  // ── llamadas anidadas: el panel entra en actualizar_altura() / factor_balance() (detail = se pueden ocultar) ──
  _nh(n) { return 1 + Math.max(this.height(n.left), this.height(n.right)); }   // altura que tendrá n (sin modificarlo)
  _enterUpd(n, float = {}) {
    this._push(`actualizar_altura(${n.name})`);
    const o = { vars: { n }, float, detail: true };
    this.rec('actualizar_altura', 'call', `entra en actualizar_altura(${n.name})`, n, 'compare', o);
    const hl = this.height(n.left), hr = this.height(n.right);
    this.upd(n);                                  // aquí es donde de verdad cambia n->altura
    this.rec('actualizar_altura', 'calc', `${n.name}->altura = 1 + max(altura(izq)=${hl}, altura(der)=${hr}) = ${n.height}`, n, 'found', o);
    this._pop();
  }
  _enterFb(n) {
    this._push(`factor_balance(${n.name})`);
    const o = { vars: { n }, detail: true }, hl = this.height(n.left), hr = this.height(n.right);
    this.rec('factor_balance', 'call', `entra en factor_balance(${n.name})`, n, 'compare', o);
    this.rec('factor_balance', 'calc', `return altura(der) − altura(izq) = ${hr} − ${hl} = ${hr - hl}`, n, 'found', o);
    this._pop();
  }

  // ── rotación genérica: 'R' = rotar_derecha, 'L' = rotar_izquierda ──
  rotate(z, set, dir) {
    const R = dir === 'R', file = R ? 'rotar_derecha' : 'rotar_izquierda';
    const a = R ? 'left' : 'right', b = R ? 'right' : 'left', T = R ? 'T3' : 'T2';
    this._push(`${file}(${z.name})`);
    const f = (tag, d, node, o) => this.rec(file, tag, d, node, 'rotate', { ...o, pivot: z.id, dir: R ? 'right' : 'left' });

    f('call', `${file}(${z.name}): z es el hueco donde está ${z.name}`, z, { vars: { z } });
    const y = z[a]; z[a] = null;
    f('y', `auto y = std::move(z->${SP[a]}) → y=${y.name}; ${z.name}->${SP[a]} queda en nullptr`, y, { vars: { z, y }, float: { y } });

    const t = y[b]; y[b] = null; z[a] = t;
    f('t3', `z->${SP[a]} = std::move(y->${SP[b]}) → ${t ? `${t.name} (${T}) pasa de ${y.name} a ${z.name}` : `${T} es nullptr`}`,
      z, { vars: { z, y, [T]: t }, float: { y }, hot: t ? [t.id] : [] });

    f('h1', `actualizar_altura(z) → altura(${z.name}) = ${this._nh(z)}`, z, { vars: { z, y }, float: { y } });
    this._enterUpd(z, { y });

    set(null); y[b] = z;                       // el hueco queda vacío: z viaja dentro de y
    f('yz', `y->${SP[b]} = std::move(z) → ${z.name} cuelga de ${y.name}; el hueco (donde estaba ${z.name}) queda en nullptr`,
      z, { vars: { y }, names: { z }, float: { y }, hot: [z.id] });

    set(y);                                     // y ocupa el hueco
    f('root', `z = std::move(y) → ${y.name} ocupa el hueco de ${z.name}: es la nueva raíz del subárbol`, y,
      { vars: { z: y }, names: { z, y }, hot: [y.id] });

    f('h2', `actualizar_altura(z) → altura(${y.name}) = ${this._nh(y)}`, y, { vars: { z: y } });
    this._enterUpd(y);
    this.rotations++;
    f('cnt', `++contador_rotaciones → ${this.rotations}`, y, { vars: { z: y } });
    this._pop();
  }

  // ── balancear: 4 casos ──────────────────────────────────────────
  balance(n, set) {
    this._push(`balancear(${n.name})`);
    const b = (tag, d, o = {}) => this.rec('balancear', tag, d, n, o.action || 'none', { vars: { n }, ...o });
    b('h', `actualizar_altura(n) → altura(${n.name}) = ${this._nh(n)}`);
    this._enterUpd(n);
    const fb = this.fb(n);
    b('fb', `fb de ${n.name} = altura(der) − altura(izq) = ${this.height(n.right)} − ${this.height(n.left)} = ${fb}`);
    this._enterFb(n);
    b('gtR', `¿fb > 1?  ${fb} > 1 → ${fb > 1 ? `SÍ: ${n.name} pesa a la DERECHA` : 'no'}`);
    if (fb > 1) {
      const c = this.fb(n.right);
      b('rlCheck', `fb(${n.name}->der = ${n.right.name}) = ${c} → ${c < 0 ? 'zigzag (RL)' : 'recto (RR)'}`);
      this._enterFb(n.right);
      if (c < 0) {
        b('RL', `Caso RL: primero rotar_derecha(${n.name}->der = ${n.right.name})`, { caso: 'RL' });
        this.rotate(n.right, v => { n.right = v; }, 'R');
      }
      b('RR', `${c < 0 ? 'Caso RL' : 'Caso RR'}: rotar_izquierda(${n.name})`, { caso: c < 0 ? 'RL' : 'RR' });
      this.rotate(n, set, 'L');
    } else {
      b('ltL', `¿fb < −1?  ${fb} < −1 → ${fb < -1 ? `SÍ: ${n.name} pesa a la IZQUIERDA` : 'no'}`);
      if (fb < -1) {
        const c = this.fb(n.left);
        b('lrCheck', `fb(${n.name}->izq = ${n.left.name}) = ${c} → ${c > 0 ? 'zigzag (LR)' : 'recto (LL)'}`);
        this._enterFb(n.left);
        if (c > 0) {
          b('LR', `Caso LR: primero rotar_izquierda(${n.name}->izq = ${n.left.name})`, { caso: 'LR' });
          this.rotate(n.left, v => { n.left = v; }, 'L');
        }
        b('LL', `${c > 0 ? 'Caso LR' : 'Caso LL'}: rotar_derecha(${n.name})`, { caso: c > 0 ? 'LR' : 'LL' });
        this.rotate(n, set, 'R');
      } else b('ok', `|fb| ≤ 1 → ${n.name} ya está balanceado`);
    }
    this._pop();
  }

  // ── insertar ────────────────────────────────────────────────────
  // name: nombre del nodo NUEVO (obligatorio en la interfaz). Si la clave ya existe no se usa.
  // Sin nombre (tests, casos de la guía) se asigna el siguiente libre: A, B, C …
  insert(key, value = null, name = null) {
    if (name != null && !this.has(key)) {
      const bad = validateName(name, nameSet(this.names()));
      if (bad) throw new Error(`Nombre no válido para la clave ${key}: ${bad}`);
    }
    this._begin();
    this._ins(this.root, key, value, name, v => { this.root = v; }, 'raiz');
    this.rec('insertar', 'call', this._skip ? `Clave ${key} ya existía: árbol sin cambios` : `Fin de insertar_avl(${key})`);
  }
  _ins(n, key, value, name, set, slot) {
    this._push(`insertar_avl(${n ? n.name : slot}, ${key})`);
    const r = (tag, d, node = n, act = 'compare', o = {}) => this.rec('insertar', tag, d, node, act, { vars: { raiz: n }, ...o });
    if (!n) {
      this.rec('insertar', 'nulo', `${slot} es nullptr → hay un hueco libre`, null, 'create', { vars: { raiz: S(slot) } });
      const nn = new Node(key, value, name ?? this._autoName());
      this.rec('constructor_nodo', 'init', `NodoBST(${key}): nodo «${nn.name}» con altura = 1, izq = der = nullptr`, nn, 'create', { float: { nuevo: nn } });
      set(nn);
      this.rec('insertar', 'crear', `raiz = make_unique<Nodo>(${key}, ${nn.value}) → ${slot} ahora apunta al nodo nuevo ${nn.name}`, nn, 'create', { vars: { raiz: nn }, hot: [nn.id] });
      this.rec('insertar', 'ret', `hoja nueva → no hay desbalance, return`, nn, 'none', { vars: { raiz: nn } });
      this._pop(); return;
    }
    r('menor', `¿${key} < ${n.name}->clave (${n.key})?  ${key < n.key ? 'SÍ' : 'no'}`);
    if (key < n.key) { r('izq', `insertar_avl(${n.name}->izq, ${key}) → bajar a la IZQUIERDA`); this._ins(n.left, key, value, name, v => { n.left = v; }, `${n.name}->izq`); }
    else {
      r('mayor', `¿${key} > ${n.name}->clave (${n.key})?  ${key > n.key ? 'SÍ' : 'no'}`);
      if (key > n.key) { r('der', `insertar_avl(${n.name}->der, ${key}) → bajar a la DERECHA`); this._ins(n.right, key, value, name, v => { n.right = v; }, `${n.name}->der`); }
      else {
        if (value !== null) n.value = value;
        r('dup', `Clave duplicada: ${n.name} ya guarda la clave ${key}; solo se actualiza el valor (el árbol no cambia)`, n, 'found');
        this._skip = true; this._pop(); return;
      }
    }
    if (this._skip) { this._pop(); return; }
    r('bal', `Al regresar: balancear(${n.name})`, n, 'none');
    this.balance(n, set);
    this._pop();
  }

  // ── eliminar ────────────────────────────────────────────────────
  delete(key) {
    this._begin();
    this._del(this.root, key, v => { this.root = v; }, 'raiz');
    this.rec('eliminar_avl', 'call', this._skip ? `La clave ${key} no existe: árbol sin cambios` : `Fin de eliminar_avl(${key})`);
  }
  _del(n, key, set, slot) {
    this._push(`eliminar_avl(${n ? n.name : slot}, ${key})`);
    const r = (tag, d, node = n, act = 'compare', o = {}) => this.rec('eliminar_avl', tag, d, node, act, { vars: { raiz: n }, ...o });
    if (!n) { this.rec('eliminar_avl', 'nulo', `${slot} es nullptr → la clave ${key} no existe, return`, null, 'delete', { vars: { raiz: S(slot) } }); this._skip = true; this._pop(); return; }
    r('menor', `¿${key} < ${n.name}->clave (${n.key})?  ${key < n.key ? 'SÍ' : 'no'}`);
    if (key < n.key) { r('izq', `eliminar_avl(${n.name}->izq, ${key}) → IZQUIERDA`); this._del(n.left, key, v => { n.left = v; }, `${n.name}->izq`); }
    else {
      r('mayor', `¿${key} > ${n.name}->clave (${n.key})?  ${key > n.key ? 'SÍ' : 'no'}`);
      if (key > n.key) { r('der', `eliminar_avl(${n.name}->der, ${key}) → DERECHA`); this._del(n.right, key, v => { n.right = v; }, `${n.name}->der`); }
      else {
        r('hallado', `¡Nodo ${n.name} (clave ${key}) encontrado!`, n, 'delete');
        let cur = n;                                    // lo que queda en el hueco (raiz)
        if (!n.left && !n.right) { r('hoja', `Caso 1: ${n.name} es hoja → raiz = nullptr (${n.name} se destruye)`, n, 'delete'); set(null); cur = null; }
        else if (!n.left || !n.right) {                 // Caso 2: un solo hijo → auto hijo = move(raiz->X); raiz = move(hijo)
          const R = !n.left, sd = R ? 'der' : 'izq', ch = R ? n.right : n.left;
          if (R) n.right = null; else n.left = null;
          r(R ? 'hijoDer' : 'hijoIzq', `Caso ${R ? '2a: solo hijo DER' : '2b: solo hijo IZQ'} → auto hijo = std::move(${n.name}->${sd}) → hijo=${ch.name}; ${n.name}->${sd} queda en nullptr`,
            n, 'delete', { vars: { raiz: n, hijo: ch }, float: { hijo: ch } });
          set(ch); cur = ch;
          r(R ? 'movDer' : 'movIzq', `raiz = std::move(hijo) → ${ch.name} ocupa el hueco de ${n.name}; el nodo ${n.name} se destruye`, ch, 'delete',
            { vars: { raiz: ch }, names: { raiz: n, hijo: ch }, hot: [ch.id] });
        }
        else {
          r('dos', `Caso 3: ${n.name} tiene dos hijos → usar el sucesor inorden`, n, 'compare');
          const s = this._descend('minimo', n.right, 'left', { raiz: n });
          const V = { raiz: n, suc: s, clave_suc: { key: s.key, plain: true } };
          r('suc', `Nodo* suc = minimo(raiz->der) → suc=${s.name} (clave ${s.key})`, s, 'found', { vars: V });
          r('cs', `K clave_suc = suc->clave → ${s.key}`, s, 'compare', { vars: V });
          n.key = s.key; n.value = s.value;
          r('ck', `raiz->clave = clave_suc → ${n.name} ahora guarda ${s.key} (copia de la clave de ${s.name}; ${n.name} conserva su nombre)`, n, 'create', { vars: V });
          r('rec', `eliminar_avl(${n.name}->der, ${s.key}) → borrar el sucesor original ${s.name}`, n, 'delete', { vars: V });
          this._del(n.right, s.key, v => { n.right = v; }, `${n.name}->der`);
        }
        if (cur !== n && cur) n = cur;                  // cur reemplaza a n en el hueco
        if (!cur) { r('bal', `${slot} es nullptr → nada que balancear`, null, 'none', { vars: { raiz: S(slot) } }); this._pop(); return; }
      }
    }
    if (this._skip) { this._pop(); return; }
    r('bal', `Al regresar: balancear(${n.name})`, n, 'none');
    this.balance(n, set);
    this._pop();
  }

  // ── buscar (recursivo, igual que el C++ del panel) ─────────────
  search(key) { this._begin(); return this._s(this.root, key, 'raiz'); }
  _s(n, key, slot) {
    this._push(`buscar(${n ? n.name : slot}, ${key})`);
    let res = null;
    const r = (tag, d, act = 'compare') => this.rec('buscar', tag, d, n, act, { vars: { raiz: n } });
    if (!n) this.rec('buscar', 'nulo', `${slot} es nullptr → clave ${key} NO encontrada`, null, 'delete', { vars: { raiz: S(slot) } });
    else if (key === n.key) { r('igual', `¿${key} == ${n.name}->clave (${n.key})? SÍ → return ${n.name}.get()`, 'found'); res = n; }
    else {
      const side = key < n.key ? 'izq' : 'der';
      r('igual', `¿${key} == ${n.name}->clave (${n.key})? no`);
      r('menor', `¿${key} < ${n.name}->clave (${n.key})? ${key < n.key ? 'SÍ' : 'no'}`);
      r(side, `buscar(${n.name}->${side}, ${key})`);
      res = this._s(key < n.key ? n.left : n.right, key, `${n.name}->${side}`);
    }
    this._pop(); return res;
  }

  // ── recorridos ──────────────────────────────────────────────────
  inorder()   { this._begin(); this._trav('inorden', this.root, null, 'raiz'); }
  preorder()  { this._begin(); this._trav('preorden', this.root, null, 'raiz'); }
  postorder() { this._begin(); this._trav('postorden', this.root, null, 'raiz'); }
  _trav(kind, n, parent, slot) {
    const file = 'imprimir_' + kind;
    this._push(`${file}(${n ? n.name : slot})`);
    if (!n) this.rec(file, 'nulo', `${slot} es nullptr → return`, parent, 'compare', { vars: { n: S(slot) } });
    else {
      const V = { n };
      for (const s of { preorden: ['visita', 'izq', 'der'], inorden: ['izq', 'visita', 'der'], postorden: ['izq', 'der', 'visita'] }[kind]) {
        if (s === 'visita') this.rec(file, s, `Visitar ${n.name}: cout << ${n.key}`, n, 'found', { vars: V });
        else {
          this.rec(file, s, `${file}(${n.name}->${s}) → ir a la ${s === 'izq' ? 'IZQUIERDA' : 'DERECHA'} de ${n.name}`, n, 'compare', { vars: V });
          this._trav(kind, s === 'izq' ? n.left : n.right, n, `${n.name}->${s}`);
        }
      }
    }
    this._pop();
  }

  // ── consultas ───────────────────────────────────────────────────
  getHeight() {
    this._begin(); const h = this.height(this.root);
    this.rec('altura', 'ret', `altura(raiz) → return n ? n->altura : 0 → ${h}`, this.root, 'found', { vars: { n: this.root ?? S('raiz') } });
    return h;
  }
  findMin() { return this._ext('minimo', 'left'); }
  findMax() { return this._ext('maximo', 'right'); }
  _ext(file, side) {
    this._begin();
    if (!this.root) { this.rec(file, 'cond', 'El árbol está vacío (en C++ habría que comprobar raiz antes).'); return null; }
    return this._descend(file, this.root, side);
  }
  // minimo()/maximo() son recursivas en el C++: cada bajada es una llamada nueva (pila y nombres propios por nivel).
  _descend(file, start, side, extra = {}) {
    let s = start, pushed = 0;
    const m = (tag, d, act = 'compare') => this.rec(file, tag, d, s, act, { vars: { n: s, ...extra } });
    const enter = () => { this._push(`${file}(${s.name})`); pushed++; };
    enter();
    while (true) {
      m('cond', `¿${s.name}->${SP[side]} existe? ${s[side] ? 'SÍ' : 'no'}`);
      if (!s[side]) break;
      m('baja', `${file}(${s.name}->${SP[side]}) → bajar a ${s[side].name}`);
      s = s[side]; enter();
    }
    m('fin', `${s.name}->${SP[side]} es nullptr → ${file} = ${s.name} (clave ${s.key})`, 'found');
    while (pushed--) this._pop();
    return s;
  }
}
