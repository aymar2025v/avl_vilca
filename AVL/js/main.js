// js/main.js — Simulador AVL v9 (Vue 3, sin build: módulos ES)
import { AVLTree, MAX_ANIMATED } from './core/AVLTree.js';
import { CASES, applyCase, loadExample } from './core/cases.js';
import { buildScene, blend } from './utils/scene.js';
import { CPP_SOURCE, FN_META, TAGS, FN_ORDER } from './utils/cpp_source.js';
import { renderCode, pill, NODE_VARS } from './utils/highlight.js';
import { parseKeys } from './utils/input.js';
import { stepOverIndex, stepOutIndex } from './utils/stepping.js';
import { nameSet, suggestNames, validateName, NAME_MAX } from './utils/names.js';

// Vue: copia local en js/vendor/ (funciona sin Internet; se baja con `node tools/fetch-vue.mjs`) y, si no está, el CDN.
const Vue = await import('./vendor/vue.esm-browser.prod.js')
  .catch(() => import('https://cdn.jsdelivr.net/npm/vue@3.5.13/dist/vue.esm-browser.prod.js'));
const { createApp, ref, shallowRef, computed, watch, nextTick, onMounted, onBeforeUnmount } = Vue;

const MAX_NODES = 255;   // cada paso guarda una foto del árbol: con muchos más nodos se dispara la memoria
const tree  = new AVLTree();                 // modelo: la vista solo lee tree.history
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const findNode = (n, id) => !n ? null : n.id === id ? n : findNode(n.left, id) ?? findNode(n.right, id);
const EMPTY = { nodes: [], edges: [], boxes: [], arc: null, w: 0, h: 0 };
const sceneCache = new WeakMap();            // buildScene se calcula una sola vez por fotograma
const sceneOf = f => { let s = sceneCache.get(f); if (!s) sceneCache.set(f, s = buildScene(f)); return s; };

// Operaciones disponibles (la interfaz se genera a partir de esta tabla)
//   many: acepta lista de claves · grow: puede añadir nodos · ro: solo lectura (el árbol no cambia de forma)
const groups = [
  { title: 'Modificar', ops: [
    { label: '➕ Insertar', cls: 'btn-blue',  key: true, many: true, grow: true, names: true, verb: 'insertaron', hint: 'Insertar la clave o la lista (Enter). Cada nodo nuevo necesita un nombre', run: (ks, v, nm) => tree.batch(ks, k => tree.insert(k, v, nm?.[k])) },
    { label: '🗑️ Eliminar', cls: 'btn-red',   key: true, many: true, verb: 'eliminaron', hint: 'Eliminar la clave o la lista',         run: ks => tree.batch(ks, k => tree.delete(k)) },
    { label: '🔍 Buscar',   cls: 'btn-green', key: true, ro: true, hint: 'Buscar la clave',                                         run: ks => tree.search(ks[0]) } ] },
  { title: 'Recorrer', ops: [
    { label: 'Inorden',   cls: 'btn-purple', ro: true, hint: 'izq → raíz → der', run: () => tree.inorder() },
    { label: 'Preorden',  cls: 'btn-purple', ro: true, hint: 'raíz → izq → der', run: () => tree.preorder() },
    { label: 'Postorden', cls: 'btn-purple', ro: true, hint: 'izq → der → raíz', run: () => tree.postorder() } ] },
  { title: 'Consultar', ops: [
    { label: '📏 Altura', cls: 'btn-teal', ro: true, hint: 'Altura del árbol', run: () => tree.getHeight() },
    { label: '⬇️ Mínimo', cls: 'btn-teal', ro: true, hint: 'Nodo mínimo',      run: () => tree.findMin() },
    { label: '⬆️ Máximo', cls: 'btn-teal', ro: true, hint: 'Nodo máximo',      run: () => tree.findMax() } ] },
];

createApp({
  setup() {
    // ── Estado ──
    const key = ref(''), val = ref(''), error = ref(''), info = ref(null), keyInput = ref(null), viewport = ref(null);
    const allFrames = shallowRef([]), detail = ref(true), idx = ref(0), playing = ref(false), speed = ref(950), pinned = ref(null);
    const view = ref({ scale: 1, x: 40, y: 40 });
    const pending = ref(null);                   // ventanita de nombres: { op, ks, v, existing, rows: [{ key, name }] }
    const showNames = ref(true);                 // C++ con los nombres de los nodos (o con raiz/n/z originales)
    const mainEl = ref(null), codeW = ref(340), splitting = ref(false);
    const CODE_W_MIN = 220;
    try { const w = Number(localStorage.getItem('avl.codeW')); if (w >= CODE_W_MIN && w < 4000) codeW.value = w; } catch { /* sin almacenamiento: se queda en 340 */ }

    // ── Derivados ──
    // detail = mostrar también los pasos DENTRO de actualizar_altura() y factor_balance()
    const frames = computed(() => detail.value ? allFrames.value : allFrames.value.filter(f => !f.debug.detail));
    const total  = computed(() => frames.value.length);
    const frame  = computed(() => frames.value[idx.value] ?? null);
    const debug  = computed(() => frame.value?.debug ?? null);
    const meta   = computed(() => FN_META[debug.value?.file]);
    const bounds = shallowRef({ w: 0, h: 0 });
    const scene  = computed(() => frame.value ? sceneOf(frame.value) : EMPTY);
    const file   = computed(() => pinned.value ?? debug.value?.file ?? null);
    // Nombres en el C++: solo cuando el panel enseña la función que se está ejecutando (no una pestaña fijada).
    // alias = primer valor de cada variable en esta llamada; names = su valor al ejecutar la línea (gana este).
    const bindings = computed(() => {
      const d = debug.value;
      if (!showNames.value || !d || file.value !== d.file) return null;
      const b = { ...d.alias, ...d.names };
      return Object.keys(b).length ? b : null;
    });
    const lines  = computed(() => (CPP_SOURCE[file.value] || []).map(l => l ? renderCode(l, bindings.value) : '&nbsp;'));
    // "en esta llamada": variable ▸ nodo, solo las que aparecen en el código que se ve
    const bindList = computed(() => {
      const b = bindings.value; if (!b) return [];
      const src = (CPP_SOURCE[file.value] || []).join('\n');
      return NODE_VARS.filter(v => b[v] && new RegExp(`\\b${v}\\b`).test(src)).map(v => ({ v, html: pill(v, b[v]) }));
    });
    const activeLines = computed(() => pinned.value && pinned.value !== debug.value?.file ? [] : debug.value?.lines ?? []);
    const tabs   = FN_ORDER.filter(f => CPP_SOURCE[f]);   // todas las funciones, siempre
    const canvasStyle = computed(() => ({ transform: `translate(${view.value.x}px, ${view.value.y}px) scale(${view.value.scale})` }));
    const output = computed(() => {   // claves visitadas por un recorrido
      if (!debug.value?.file.startsWith('imprimir')) return [];
      return frames.value.slice(0, idx.value + 1).filter(f => f.debug.action === 'found')
        .map(f => findNode(frame.value.snapshot, f.debug.activeNodeId)?.key).filter(k => k !== undefined);
    });

    // ── Animación: interpola nodos y flechas juntos entre un paso y el siguiente ──
    const drawn = shallowRef({ nodes: [], edges: [], arc: null });
    let raf = 0, last = { nodes: new Map(), edges: [] };
    watch(scene, sc => {
      cancelAnimationFrame(raf);
      const from = new Map(drawn.value.nodes.map(n => [n.id, n])), prev = last;
      last = { nodes: new Map(sc.nodes.map(n => [n.id, n])), edges: sc.edges };
      const dur = playing.value ? Math.min(450, (1650 - speed.value) * .6) : 450, t0 = performance.now();
      const tick = now => {
        const t = Math.min((now - t0) / dur, 1);
        drawn.value = blend(sc, from, prev, t);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });

    // ── Reproductor ──
    const pause = () => { playing.value = false; };
    const go    = i => { idx.value = clamp(i, 0, Math.max(total.value - 1, 0)); };
    const step  = d => { pause(); go(idx.value + d); };
    const stepOver = () => { pause(); go(stepOverIndex(frames.value, idx.value)); };   // Saltar: pasa por encima de la llamada actual
    const stepOut  = () => { pause(); go(stepOutIndex(frames.value, idx.value)); };    // Salir: termina la función actual
    const toggleDetail = e => {                       // mantiene el cursor en el mismo paso (o el visible anterior)
      pause(); const cur = frame.value, all = allFrames.value;
      detail.value = e.target.checked; e.target.blur?.();
      let i = all.indexOf(cur); while (i > 0 && !frames.value.includes(all[i])) i--;
      idx.value = Math.max(0, frames.value.indexOf(all[i]));
    };
    const togglePlay = () => {
      if (playing.value) return pause();
      if (total.value < 2) return;
      if (idx.value >= total.value - 1) idx.value = 0;
      playing.value = true;
    };
    const nextRot = () => {
      pause(); const i = frames.value.findIndex((f, j) => j > idx.value && f.debug.file.startsWith('rotar') && f.debug.lines[0] === TAGS[f.debug.file].call[0]);
      if (i >= 0) go(i); else fail('No hay más rotaciones en esta operación');
    };
    let timer = null;
    watch([playing, speed], () => {
      clearInterval(timer);
      if (playing.value) timer = setInterval(() => idx.value >= total.value - 1 ? pause() : idx.value++, 1650 - speed.value);
    });
    watch(idx, () => {
      pinned.value = null;
      nextTick(() => {
        document.querySelector('.cl.active')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        document.querySelector('.code-tab.running')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    });

    // ── Operaciones ──
    const fail = msg => { error.value = msg; setTimeout(() => { error.value = ''; }, 3500); };
    // structural = false → la forma del árbol no cambia (recorridos, búsqueda…): basta el primer fotograma para encuadrar
    const load = (fr, structural = true) => {
      const sc = (structural ? fr : fr.slice(0, 1)).map(sceneOf);
      bounds.value = { w: Math.max(0, ...sc.map(s => s.w)), h: Math.max(0, ...sc.map(s => s.h)) };
      allFrames.value = fr; idx.value = 0; nextTick(fit);
    };
    // 1) valida lo escrito → { ks, v }   2) (solo Insertar) pide el nombre de cada clave nueva   3) ejecuta
    const prepare = op => {
      if (!op.key) return { ks: null, v: null };
      const p = parseKeys(key.value, { maxCount: MAX_NODES });
      if (p.error) return fail(p.error);
      if (p.keys.length > 1 && !op.many) return fail('Esta operación admite una sola clave');
      const v = val.value.trim() || null;
      if (v && p.keys.length > 1) return fail('Con varias claves deja "Valor" vacío (cada valor será su clave)');
      if (op.grow && tree.size() + new Set(p.keys).size > MAX_NODES) return fail(`Máximo ${MAX_NODES} nodos (ahora hay ${tree.size()})`);
      return { ks: p.keys, v };
    };
    const run = (op, ks, v, names) => {
      pause(); info.value = null;
      op.run(ks, v, names); load(tree.history, !op.ro);
      if (op.many && ks.length > MAX_ANIMATED)
        info.value = { ok: true, text: `Se ${op.verb} ${ks.length} claves en silencio; solo se anima la última (${ks[ks.length - 1]}). Total de nodos: ${tree.size()}.` };
      key.value = ''; val.value = ''; keyInput.value?.focus();
    };
    const exec = op => {
      const p = prepare(op); if (!p) return;
      const need = op.names ? [...new Set(p.ks)].filter(k => !tree.has(k)) : [];   // las claves que ya existen no crean nodo
      if (need.length) return askNames(op, p, need);
      run(op, p.ks, p.v, null);
    };

    // ── Ventanita de nombres: cada nodo nuevo necesita un nombre único (A, B, …) ──
    const nameErrors = computed(() => {
      const p = pending.value; if (!p) return [];
      const taken = nameSet(tree.names()), count = new Map();
      for (const r of p.rows) { const k = r.name.trim().toLowerCase(); count.set(k, (count.get(k) || 0) + 1); }
      return p.rows.map(r => validateName(r.name, taken) || (count.get(r.name.trim().toLowerCase()) > 1 ? `"${r.name.trim()}" está repetido en esta lista` : ''));
    });
    const namesOk = computed(() => !!pending.value && nameErrors.value.every(e => !e));
    const fillNames = () => {                          // sugiere A, B, C… (los que no estén ya en el árbol)
      const sug = suggestNames(nameSet(tree.names()), pending.value.rows.length);
      pending.value.rows.forEach((r, i) => { r.name = sug[i]; });
    };
    const askNames = (op, p, need) => {
      pending.value = { op, ks: p.ks, v: p.v, existing: [...new Set(p.ks)].filter(k => tree.has(k)), rows: need.map(k => ({ key: k, name: '' })) };
      fillNames();
      nextTick(() => { const i = document.querySelector('.name-row input'); i?.focus(); i?.select(); });
    };
    const confirmNames = () => {
      if (!namesOk.value) { document.querySelector('.name-row.bad input')?.focus(); return; }
      const p = pending.value, names = Object.fromEntries(p.rows.map(r => [r.key, r.name.trim()]));
      pending.value = null;
      run(p.op, p.ks, p.v, names);
    };
    const cancelNames = () => { pending.value = null; keyInput.value?.focus(); };
    const nameEnter = (e, i) => {                      // Enter: siguiente nombre; en el último, confirmar
      if (e.repeat) return;
      const inputs = document.querySelectorAll('.name-row input');
      if (i < inputs.length - 1) { inputs[i + 1].focus(); inputs[i + 1].select(); } else confirmNames();
    };
    const onEnter = (e, op) => { if (!e.repeat) exec(op); };   // keydown (no keyup): el Enter que confirma el diálogo no vuelve a disparar Insertar

    // ── Panel de código: ancho arrastrable (se recuerda entre sesiones) ──
    const splitMax = () => Math.max(CODE_W_MIN, (mainEl.value?.getBoundingClientRect().width ?? 1000) * .7);
    const setCodeW = w => { codeW.value = Math.round(clamp(w, CODE_W_MIN, splitMax())); };
    const saveCodeW = () => { try { localStorage.setItem('avl.codeW', String(codeW.value)); } catch { /* sin almacenamiento */ } };
    const splitDown = e => { e.preventDefault(); splitting.value = true; e.currentTarget.setPointerCapture?.(e.pointerId); };
    const splitMove = e => { if (splitting.value) setCodeW(e.clientX - mainEl.value.getBoundingClientRect().left); };
    const splitUp   = () => { if (splitting.value) { splitting.value = false; saveCodeW(); } };
    const splitKey  = e => {
      const d = { ArrowLeft: -20, ArrowRight: 20 }[e.key];
      if (d) setCodeW(codeW.value + d); else if (e.key === 'Home') setCodeW(340); else return;
      e.preventDefault(); e.stopPropagation(); saveCodeW();   // stopPropagation: las flechas no deben pasar de paso a la vez
    };
    const splitReset = () => { setCodeW(340); saveCodeW(); };
    const runCase = e => {
      const c = CASES.find(x => x.id === e.target.value); e.target.value = '';
      if (!c) return;
      pause();
      const r = applyCase(tree, c);
      info.value = { ok: r.ok, text: `${c.title} — ${c.about}  Esperado: ${c.expect}.  ${r.ok ? '✓ Cumple lo que comprueba avl_main.cpp' : '✗ NO cumple lo que comprueba avl_main.cpp'}` };
      load(r.frames);
    };
    const example = () => { pause(); info.value = null; load(loadExample(tree)); };
    const reset   = () => { pause(); info.value = null; tree.clear(); load([]); };

    // ── Zoom / pan ──
    const zoomAt = (f, cx, cy) => {
      const v = view.value, s = clamp(v.scale * f, .2, 4), r = s / v.scale;
      view.value = { scale: s, x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r };
    };
    const onWheel = e => { const r = viewport.value.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.1 : .9, e.clientX - r.left, e.clientY - r.top); };
    const zoomBtn = f => { const r = viewport.value.getBoundingClientRect(); zoomAt(f, r.width / 2, r.height / 2); };
    function fit() {
      if (!viewport.value) return;
      const r = viewport.value.getBoundingClientRect(), { w, h } = bounds.value;
      const s = w ? clamp(Math.min((r.width - 80) / w, (r.height - 80) / h, 1), .2, 4) : 1;
      view.value = { scale: s, x: (r.width - w * s) / 2, y: 40 };
    }
    let drag = null;
    const onDown = e => { if (e.button === 0) drag = { x: e.clientX, y: e.clientY }; };
    const onMove = e => {
      if (!drag) return;
      view.value = { ...view.value, x: view.value.x + e.clientX - drag.x, y: view.value.y + e.clientY - drag.y };
      drag = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { drag = null; };
    const onKey = e => {
      if (pending.value) return;                           // con la ventanita de nombres abierta no hay atajos
      const t = e.target, field = t.tagName === 'INPUT' && t.type !== 'range';
      // se bloquean los atajos mientras escribes (valor, o clave no vacía) o en el selector de casos
      if (t.tagName === 'SELECT' || (field && (t !== keyInput.value || String(key.value) !== ''))) return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      else if (t.type === 'range') return;                  // en un slider las flechas son del slider
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
      else if (e.key === 'ArrowDown')  { e.preventDefault(); stepOver(); }
      else if (e.key === 'ArrowUp')    { e.preventDefault(); stepOut(); }
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End')  go(total.value - 1);
    };
    onMounted(() => { addEventListener('keydown', onKey); addEventListener('mousemove', onMove); addEventListener('mouseup', onUp); });
    onBeforeUnmount(() => { removeEventListener('keydown', onKey); removeEventListener('mousemove', onMove); removeEventListener('mouseup', onUp); clearInterval(timer); cancelAnimationFrame(raf); });

    const fbClass = fb => Math.abs(fb) > 1 ? 'badge-red' : Math.abs(fb) === 1 ? 'badge-amber' : 'badge-teal';
    const hl = n => n.active ? 'hl-' + (['compare', 'found', 'create', 'delete', 'rotate'].includes(debug.value.action) ? debug.value.action : 'compare') : '';
    const tabLabel = f => FN_META[f]?.label ?? f;

    return { groups, cases: CASES, key, val, error, info, keyInput, viewport, frames, detail, idx, total, playing, speed, pinned, view,
             frame, debug, drawn, meta, scene, file, lines, activeLines, bounds, tabs, canvasStyle, output,
             pause, go, step, stepOver, stepOut, toggleDetail, togglePlay, nextRot, exec, runCase, example, reset, zoomBtn, fit, onWheel, onDown, fbClass, hl, tabLabel,
             // v9
             pending, nameErrors, namesOk, fillNames, confirmNames, cancelNames, nameEnter, onEnter, NAME_MAX,
             showNames, bindList, mainEl, codeW, splitting, splitDown, splitMove, splitUp, splitKey, splitReset };
  }
}).mount('#app');
