// ═══════════════════════════════════════════════════════════════
//  Constantes
// ═══════════════════════════════════════════════════════════════
const R = 24;                 // radio del nodo
const NULL_R = 11;            // radio del marcador ∅
const VIEWBOX = "0 0 800 520";
const NULL_OFFSET = 50;       // desplazamiento diagonal del ∅ respecto del padre

const L_BEFORE = {
  n50: { x: 400, y: 80 },
  n30: { x: 250, y: 190 },
  n70: { x: 550, y: 190 },
  n20: { x: 150, y: 300 },
  n40: { x: 350, y: 300 },
  n10: { x: 70,  y: 410 }
};

const L_AFTER = {
  n30: { x: 400, y: 80 },
  n20: { x: 250, y: 190 },
  n50: { x: 550, y: 190 },
  n10: { x: 150, y: 300 },
  n40: { x: 450, y: 300 },
  n70: { x: 650, y: 300 }
};

const FUNCTION_CODE = [
  "void rotar_derecha(std::unique_ptr<NodoBST<K,V>>& z) {",
  "    auto y = std::move(z->izq);",
  "    z->izq = std::move(y->der);",
  "    actualizar_altura(z);",
  "    y->der = std::move(z);",
  "    z = std::move(y);",
  "    actualizar_altura(z);",
  "    ++contador_rotaciones;",
  "}",
];

const NODE_STYLES = {
  normal:    { stroke: '#d4d4d4', fill: '#ffffff', text: '#374151' },
  highlight: { stroke: '#fbbf24', fill: '#fef3c7', text: '#78350f', dashed: true },
  purple:    { stroke: '#a78bfa', fill: '#ede9fe', text: '#5b21b6' },
  orange:    { stroke: '#fb923c', fill: '#ffedd5', text: '#9a3412' },
  ghost:     { stroke: '#e5e7eb', fill: '#fafafa', text: '#d1d5db', dashed: true },
};

const frames = [
  // ── 1. Entrada a la función ────────────────────────────────
  {
    activeLines: [0],
    nodes: [
      { id:'n50', x: L_BEFORE.n50.x, y: L_BEFORE.n50.y, label:'50', h:4, style:'highlight', izq:'n30', der:'n70' },
      { id:'n30', x: L_BEFORE.n30.x, y: L_BEFORE.n30.y, label:'30', h:3, style:'normal',    izq:'n20', der:'n40' },
      { id:'n70', x: L_BEFORE.n70.x, y: L_BEFORE.n70.y, label:'70', h:1, style:'normal',    izq:null,  der:null },
      { id:'n20', x: L_BEFORE.n20.x, y: L_BEFORE.n20.y, label:'20', h:2, style:'normal',    izq:'n10', der:null },
      { id:'n40', x: L_BEFORE.n40.x, y: L_BEFORE.n40.y, label:'40', h:1, style:'normal',    izq:null,  der:null },
      { id:'n10', x: L_BEFORE.n10.x, y: L_BEFORE.n10.y, label:'10', h:1, style:'normal',    izq:null,  der:null },
    ],
    nullHighlights: [],
    refs: [
      { side:'left',  label:'y', sub:'unique_ptr', style:'ghost', target:null },
      { side:'right', label:'z', sub:'referencia', style:'orange', target:'n50' },
    ],
    note: 'Estado inicial. Hemos insertado <strong>10</strong> (como hijo de 20). Esto ha desbalanceado el árbol en el nodo <strong>50</strong> (fb = −2). Es un caso LL, pero ojo: el nodo <code>30</code> tiene un hijo derecho, el <strong>40</strong>. Este es nuestro <code>T3</code>.',
  },

  // ── 2. auto y = std::move(z->izq) ─────────────────────────
  {
    activeLines: [1],
    nodes: [
      { id:'n50', x: L_BEFORE.n50.x, y: L_BEFORE.n50.y, label:'50', h:4, style:'highlight', izq:null,  der:'n70' },
      { id:'n30', x: L_BEFORE.n30.x, y: L_BEFORE.n30.y, label:'30', h:3, style:'purple',    izq:'n20', der:'n40' },
      { id:'n70', x: L_BEFORE.n70.x, y: L_BEFORE.n70.y, label:'70', h:1, style:'normal',    izq:null,  der:null },
      { id:'n20', x: L_BEFORE.n20.x, y: L_BEFORE.n20.y, label:'20', h:2, style:'normal',    izq:'n10', der:null },
      { id:'n40', x: L_BEFORE.n40.x, y: L_BEFORE.n40.y, label:'40', h:1, style:'normal',    izq:null,  der:null },
      { id:'n10', x: L_BEFORE.n10.x, y: L_BEFORE.n10.y, label:'10', h:1, style:'normal',    izq:null,  der:null },
    ],
    nullHighlights: ['n50.izq'],
    refs: [
      { side:'left',  label:'y', sub:'unique_ptr', style:'purple', target:'n30' },
      { side:'right', label:'z', sub:'referencia', style:'orange', target:'n50' },
    ],
    note: '<code>std::move(z->izq)</code> extrae todo el subárbol de 30 y se lo asigna a <code>y</code>. El puntero <code>z->izq</code> (la flecha hacia el 30) queda en ∅ (resaltado).',
  },

  // ── 3. z->izq = std::move(y->der) ─────────────────────────
  {
    activeLines: [2],
    nodes: [
      { id:'n50', x: L_BEFORE.n50.x, y: L_BEFORE.n50.y, label:'50', h:4, style:'highlight', izq:'n40', der:'n70' },
      { id:'n30', x: L_BEFORE.n30.x, y: L_BEFORE.n30.y, label:'30', h:3, style:'purple',    izq:'n20', der:null  },
      { id:'n70', x: L_BEFORE.n70.x, y: L_BEFORE.n70.y, label:'70', h:1, style:'normal',    izq:null,  der:null },
      { id:'n20', x: L_BEFORE.n20.x, y: L_BEFORE.n20.y, label:'20', h:2, style:'normal',    izq:'n10', der:null },
      { id:'n40', x: L_BEFORE.n40.x, y: L_BEFORE.n40.y, label:'40', h:1, style:'orange',    izq:null,  der:null },
      { id:'n10', x: L_BEFORE.n10.x, y: L_BEFORE.n10.y, label:'10', h:1, style:'normal',    izq:null,  der:null },
    ],
    nullHighlights: ['n30.der'],
    refs: [
      { side:'left',  label:'y', sub:'unique_ptr', style:'purple', target:'n30' },
      { side:'right', label:'z', sub:'referencia', style:'orange', target:'n50' },
    ],
    note: '<strong>¡Aquí está la línea mágica!</strong> <code>y->der</code> es el nodo <strong>40</strong> (T3). Lo movemos para que sea el nuevo hijo izquierdo de <code>z</code> (50). El 40 <strong>salta</strong> de la izquierda a la derecha del árbol para no perderse. El puntero <code>y->der</code> queda en ∅.',
  },

  // ── 4. actualizar_altura(z) ───────────────────────────────
  {
    activeLines: [3],
    nodes: [
      { id:'n50', x: L_BEFORE.n50.x, y: L_BEFORE.n50.y, label:'50', h:2, style:'highlight', izq:'n40', der:'n70', hChanged:true },
      { id:'n30', x: L_BEFORE.n30.x, y: L_BEFORE.n30.y, label:'30', h:3, style:'purple',    izq:'n20', der:null  },
      { id:'n70', x: L_BEFORE.n70.x, y: L_BEFORE.n70.y, label:'70', h:1, style:'normal',    izq:null,  der:null },
      { id:'n20', x: L_BEFORE.n20.x, y: L_BEFORE.n20.y, label:'20', h:2, style:'normal',    izq:'n10', der:null },
      { id:'n40', x: L_BEFORE.n40.x, y: L_BEFORE.n40.y, label:'40', h:1, style:'orange',    izq:null,  der:null },
      { id:'n10', x: L_BEFORE.n10.x, y: L_BEFORE.n10.y, label:'10', h:1, style:'normal',    izq:null,  der:null },
    ],
    nullHighlights: [],
    refs: [
      { side:'left',  label:'y', sub:'unique_ptr', style:'purple', target:'n30' },
      { side:'right', label:'z', sub:'referencia', style:'orange', target:'n50' },
    ],
    note: '<code>actualizar_altura(z)</code> recalcula la altura del 50. Ahora tiene dos hijos: 40 y 70. Su altura baja a <strong>2</strong>.',
  },

  // ── 5. y->der = std::move(z)  ← momento crítico ──────────
  {
    activeLines: [4],
    nodes: [
      { id:'n30', x: L_AFTER.n30.x, y: L_AFTER.n30.y, label:'30', h:3, style:'purple', izq:'n20', der:'n50' },
      { id:'n20', x: L_AFTER.n20.x, y: L_AFTER.n20.y, label:'20', h:2, style:'normal', izq:'n10', der:null  },
      { id:'n50', x: L_AFTER.n50.x, y: L_AFTER.n50.y, label:'50', h:2, style:'highlight', izq:'n40', der:'n70' },
      { id:'n10', x: L_AFTER.n10.x, y: L_AFTER.n10.y, label:'10', h:1, style:'normal', izq:null,  der:null },
      { id:'n40', x: L_AFTER.n40.x, y: L_AFTER.n40.y, label:'40', h:1, style:'orange', izq:null,  der:null },
      { id:'n70', x: L_AFTER.n70.x, y: L_AFTER.n70.y, label:'70', h:1, style:'normal', izq:null,  der:null },
    ],
    nullHighlights: [],
    refs: [
      { side:'left',  label:'y', sub:'unique_ptr', style:'purple', target:'n30' },
      { side:'right', label:'z', sub:'nullptr',    style:'ghost',  target:null },
    ],
    topBadge: 'raiz = ∅',
    note: '<strong>⚠ Momento crítico</strong>: <code>y->der = std::move(z)</code>. El 50 baja para convertirse en hijo derecho del 30. Como movimos <code>z</code>, la raíz del árbol queda en ∅ temporalmente. Pero el árbol está seguro dentro de <code>y</code> (el 30).',
  },

  // ── 6. z = std::move(y) ───────────────────────────────────
  {
    activeLines: [5],
    nodes: [
      { id:'n30', x: L_AFTER.n30.x, y: L_AFTER.n30.y, label:'30', h:3, style:'orange', izq:'n20', der:'n50' },
      { id:'n20', x: L_AFTER.n20.x, y: L_AFTER.n20.y, label:'20', h:2, style:'normal', izq:'n10', der:null  },
      { id:'n50', x: L_AFTER.n50.x, y: L_AFTER.n50.y, label:'50', h:2, style:'normal', izq:'n40', der:'n70' },
      { id:'n10', x: L_AFTER.n10.x, y: L_AFTER.n10.y, label:'10', h:1, style:'normal', izq:null,  der:null },
      { id:'n40', x: L_AFTER.n40.x, y: L_AFTER.n40.y, label:'40', h:1, style:'orange', izq:null,  der:null },
      { id:'n70', x: L_AFTER.n70.x, y: L_AFTER.n70.y, label:'70', h:1, style:'normal', izq:null,  der:null },
    ],
    nullHighlights: [],
    refs: [
      { side:'left',  label:'y', sub:'nullptr',    style:'ghost',  target:null },
      { side:'right', label:'z', sub:'referencia', style:'orange', target:'n30' },
    ],
    note: '<code>z = std::move(y)</code>: el 30 (que estaba en <code>y</code>) vuelve a la raíz. La variable <code>y</code> queda en ∅.',
  },

  // ── 7. actualizar_altura(z) (post-rotación) ──────────────
  {
    activeLines: [6],
    nodes: [
      { id:'n30', x: L_AFTER.n30.x, y: L_AFTER.n30.y, label:'30', h:3, style:'highlight', izq:'n20', der:'n50', hChanged:true },
      { id:'n20', x: L_AFTER.n20.x, y: L_AFTER.n20.y, label:'20', h:2, style:'normal',    izq:'n10', der:null  },
      { id:'n50', x: L_AFTER.n50.x, y: L_AFTER.n50.y, label:'50', h:2, style:'normal',    izq:'n40', der:'n70' },
      { id:'n10', x: L_AFTER.n10.x, y: L_AFTER.n10.y, label:'10', h:1, style:'normal',    izq:null,  der:null },
      { id:'n40', x: L_AFTER.n40.x, y: L_AFTER.n40.y, label:'40', h:1, style:'orange',    izq:null,  der:null },
      { id:'n70', x: L_AFTER.n70.x, y: L_AFTER.n70.y, label:'70', h:1, style:'normal',    izq:null,  der:null },
    ],
    nullHighlights: [],
    refs: [
      { side:'left',  label:'y', sub:'nullptr',    style:'ghost',  target:null },
      { side:'right', label:'z', sub:'referencia', style:'orange', target:'n30' },
    ],
    note: '<code>actualizar_altura(z)</code> recalcula la altura de la nueva raíz (30). Su hijo izquierdo es 20 (h=2) y su hijo derecho es 50 (h=2). Altura final: <strong>3</strong>.',
  },

  // ── 8. ++contador_rotaciones ─────────────────────────────
  {
    activeLines: [7],
    nodes: [
      { id:'n30', x: L_AFTER.n30.x, y: L_AFTER.n30.y, label:'30', h:3, style:'normal', izq:'n20', der:'n50' },
      { id:'n20', x: L_AFTER.n20.x, y: L_AFTER.n20.y, label:'20', h:2, style:'normal', izq:'n10', der:null  },
      { id:'n50', x: L_AFTER.n50.x, y: L_AFTER.n50.y, label:'50', h:2, style:'normal', izq:'n40', der:'n70' },
      { id:'n10', x: L_AFTER.n10.x, y: L_AFTER.n10.y, label:'10', h:1, style:'normal', izq:null,  der:null },
      { id:'n40', x: L_AFTER.n40.x, y: L_AFTER.n40.y, label:'40', h:1, style:'normal', izq:null,  der:null },
      { id:'n70', x: L_AFTER.n70.x, y: L_AFTER.n70.y, label:'70', h:1, style:'normal', izq:null,  der:null },
    ],
    nullHighlights: [],
    refs: [
      { side:'left',  label:'y', sub:'nullptr',    style:'ghost',  target:null },
      { side:'right', label:'z', sub:'referencia', style:'orange', target:'n30' },
    ],
    note: '<code>++contador_rotaciones</code>. Como fue una rotación simple (LL), el contador sube en 1. Si no hubiéramos movido el nodo 40, el árbol habría perdido datos.',
  },

  // ── 9. } — estado final ──────────────────────────────────
  {
    activeLines: [8],
    nodes: [
      { id:'n30', x: L_AFTER.n30.x, y: L_AFTER.n30.y, label:'30', h:3, style:'highlight', izq:'n20', der:'n50' },
      { id:'n20', x: L_AFTER.n20.x, y: L_AFTER.n20.y, label:'20', h:2, style:'normal',    izq:'n10', der:null  },
      { id:'n50', x: L_AFTER.n50.x, y: L_AFTER.n50.y, label:'50', h:2, style:'normal',    izq:'n40', der:'n70' },
      { id:'n10', x: L_AFTER.n10.x, y: L_AFTER.n10.y, label:'10', h:1, style:'normal',    izq:null,  der:null },
      { id:'n40', x: L_AFTER.n40.x, y: L_AFTER.n40.y, label:'40', h:1, style:'orange',    izq:null,  der:null },
      { id:'n70', x: L_AFTER.n70.x, y: L_AFTER.n70.y, label:'70', h:1, style:'normal',    izq:null,  der:null },
    ],
    nullHighlights: [],
    refs: [
      { side:'left',  label:'y', sub:'nullptr',    style:'ghost',  target:null },
      { side:'right', label:'z', sub:'referencia', style:'orange', target:'n30' },
    ],
    note: '✅ <strong>Rotación completa</strong>. El árbol quedó balanceado. El <strong>recorrido inorden</strong> sigue siendo <code>10, 20, 30, 40, 50, 70</code>, lo que confirma que el orden BST se mantuvo intacto y el nodo 40 sobrevivió gracias a la línea del paso 3.',
  },
];

// ═══════════════════════════════════════════════════════════════
//  Render del árbol (CORREGIDO)
// ═══════════════════════════════════════════════════════════════
function renderTree(frame) {
  // Reemplazamos Object.fromEntries por un bucle clásico para máxima compatibilidad
  const nodeMap = {};
  for (let i = 0; i < frame.nodes.length; i++) {
    nodeMap[frame.nodes[i].id] = frame.nodes[i];
  }

  // 1) Aristas
  let edgesSVG = '';
  frame.nodes.forEach(n => {
    ['izq', 'der'].forEach(side => {
      const childId = n[side];
      if (childId && nodeMap[childId]) {
        const c = nodeMap[childId];
        const dx = c.x - n.x, dy = c.y - n.y;
        const dist = Math.hypot(dx, dy);
        const ux = dx / dist, uy = dy / dist;
        edgesSVG += `<line x1="${n.x + ux * R}" y1="${n.y + uy * R}"
                            x2="${c.x - ux * R}" y2="${c.y - uy * R}"
                            stroke="#cbd5e1" stroke-width="1.5"/>`;
      }
    });
  });

  // 2) Nulls
  let nullsSVG = '';
  frame.nodes.forEach(n => {
    ['izq', 'der'].forEach(side => {
      if (n[side] === null) {
        const isHi = (frame.nullHighlights || []).indexOf(n.id + '.' + side) !== -1;
        const dx = side === 'izq' ? -NULL_OFFSET : NULL_OFFSET;
        const nx = n.x + dx;
        let ny = n.y + NULL_OFFSET;
        
        if (n.id === 'n10') { ny += 10; }

        const vx = dx, vy = ny - n.y;
        const vlen = Math.hypot(vx, vy);
        const ux = vx / vlen, uy = vy / vlen;
        const color  = isHi ? '#f97316' : '#cbd5e1';
        const fill   = isHi ? '#ffedd5' : '#f9fafb';
        const txtCol = isHi ? '#9a3412' : '#9ca3af';
        
        nullsSVG += `
          <line x1="${n.x + ux * R}" y1="${n.y + uy * R}"
                x2="${nx - ux * NULL_R}" y2="${ny - uy * NULL_R}"
                stroke="${color}" stroke-width="1.5" stroke-dasharray="4 3"/>
          <circle cx="${nx}" cy="${ny}" r="${NULL_R}"
                  fill="${fill}" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 2"/>
          <text x="${nx}" y="${ny}" fill="${txtCol}"
                font-family="'Fira Code', monospace" font-size="12"
                text-anchor="middle" dominant-baseline="central">∅</text>
        `;
      }
    });
  });

  // 3) Nodos
  let nodesSVG = '';
  frame.nodes.forEach(n => {
    const s = NODE_STYLES[n.style] || NODE_STYLES.normal;
    const dash = s.dashed ? 'stroke-dasharray="4 3"' : '';
    const hColor = n.hChanged ? '#b45309' : '#9ca3af';
    const hBg = n.hChanged
      ? `<rect x="${n.x - 17}" y="${n.y - R - 22}" width="34" height="15" rx="3" fill="#fef3c7" stroke="#fbbf24" stroke-width="0.8"/>`
      : '';
    nodesSVG += `
      <g>
        <circle cx="${n.x}" cy="${n.y}" r="${R}"
                fill="${s.fill}" stroke="${s.stroke}" stroke-width="2" ${dash}/>
        <text x="${n.x}" y="${n.y}" fill="${s.text}"
              font-family="'Fira Code', monospace" font-size="14" font-weight="600"
              text-anchor="middle" dominant-baseline="central">${n.label}</text>
        ${hBg}
        <text x="${n.x}" y="${n.y - R - 12}" fill="${hColor}"
              font-family="'Fira Code', monospace" font-size="11"
              font-weight="${n.hChanged ? 700 : 500}"
              text-anchor="middle" dominant-baseline="central">h=${n.h}</text>
      </g>`;
  });

  // 4) Refs
  let refsSVG = '';
  (frame.refs || []).forEach(ref => refsSVG += renderRef(ref, nodeMap));

  // 5) Badge
  let badgeSVG = '';
  if (frame.topBadge) {
    badgeSVG = `
      <g>
        <rect x="320" y="8" width="160" height="26" rx="6"
              fill="#fef2f2" stroke="#fca5a5" stroke-width="1.5" stroke-dasharray="4 3"/>
        <text x="400" y="21" fill="#b91c1c"
              font-family="'Fira Code', monospace" font-size="12" font-weight="700"
              text-anchor="middle" dominant-baseline="central">${frame.topBadge}</text>
      </g>`;
  }

  return `<svg viewBox="${VIEWBOX}">${edgesSVG}${nullsSVG}${nodesSVG}${refsSVG}${badgeSVG}</svg>`;
}

function renderRef(ref, nodeMap) {
  const boxW = 130, boxH = 46;
  const targetNode = ref.target ? nodeMap[ref.target] : null;
  const isGhost = ref.style === 'ghost';

  let border, text, sub, fill, dash, markerId, arrowCol;
  if (isGhost) {
    border='#e5e7eb'; text='#d1d5db'; sub='#d1d5db';
    fill='#fafafa'; dash='stroke-dasharray="4 3"';
    markerId = null; arrowCol = null;
  } else if (ref.style === 'purple') {
    border='#a78bfa'; text='#6d28d9'; sub='#6b7280';
    fill='#ffffff'; dash='';
    markerId='arrowPurple'; arrowCol='#a78bfa';
  } else {
    border='#fb923c'; text='#c2410c'; sub='#6b7280';
    fill='#ffffff'; dash='';
    markerId='arrowOrange'; arrowCol='#fb923c';
  }

  const yCenter = targetNode ? targetNode.y : 80;
  const boxY = yCenter - boxH / 2;
  const boxX = ref.side === 'right' ? 640 : 30;

  let arrowSVG = '';
  if (targetNode && markerId) {
    const x1 = ref.side === 'right' ? boxX : boxX + boxW;
    const x2 = ref.side === 'right' ? targetNode.x + R + 5 : targetNode.x - R - 5;
    arrowSVG = `<line x1="${x1}" y1="${yCenter}" x2="${x2}" y2="${yCenter}"
                     stroke="${arrowCol}" stroke-width="1.5"
                     marker-end="url(#${markerId})"/>`;
  }

  return `
    ${arrowSVG}
    <g>
      <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="6"
            fill="${fill}" stroke="${border}" stroke-width="1.5" ${dash}/>
      <text x="${boxX + boxW/2}" y="${boxY + 18}" fill="${text}"
            font-family="'Fira Code', monospace" font-size="13" font-weight="600"
            text-anchor="middle">${ref.label}</text>
      <text x="${boxX + boxW/2}" y="${boxY + 33}" fill="${sub}"
            font-family="'Fira Code', monospace" font-size="10"
            text-anchor="middle">${ref.sub || ''}</text>
    </g>`;
}

// ═══════════════════════════════════════════════════════════════
//  Render del frame completo
// ═══════════════════════════════════════════════════════════════
function renderFrame(idx) {
  const f = frames[idx];

  const codeHTML = FUNCTION_CODE.map((line, i) => {
    const active = f.activeLines.includes(i);
    return `<div class="code-line${active ? ' active' : ''}">${escapeHtml(line) || ' '}</div>`;
  }).join('');
  document.getElementById('codePanel').innerHTML = codeHTML;

  document.getElementById('treePanel').innerHTML = renderTree(f);
  document.getElementById('notePanel').innerHTML = f.note ? `<div class="note">${f.note}</div>` : '';

  document.getElementById('frameNum').textContent = idx + 1;
  document.getElementById('progress').value = idx;
  document.getElementById('prevBtn').disabled = idx === 0;
  document.getElementById('nextBtn').disabled = idx === frames.length - 1;
}

// ═══════════════════════════════════════════════════════════════
//  Navegación
// ═══════════════════════════════════════════════════════════════
let currentFrame = 0;
let isPlaying = false;
let playTimer = null;

function jumpTo(idx) { currentFrame = idx; renderFrame(currentFrame); }
function next() { if (currentFrame < frames.length - 1) { currentFrame++; renderFrame(currentFrame); } }
function prev() { if (currentFrame > 0) { currentFrame--; renderFrame(currentFrame); } }

function togglePlay() {
  isPlaying = !isPlaying;
  const playIcon  = document.getElementById('playIcon');
  const playLabel = document.getElementById('playLabel');

  if (isPlaying) {
    playIcon.textContent = '⏸';
    playLabel.textContent = 'Pausar';
    if (currentFrame >= frames.length - 1) { currentFrame = 0; renderFrame(0); }
    playTimer = setInterval(() => {
      if (currentFrame >= frames.length - 1) {
        clearInterval(playTimer);
        isPlaying = false;
        playIcon.textContent = '▶';
        playLabel.textContent = 'Reproducir';
        return;
      }
      currentFrame++;
      renderFrame(currentFrame);
    }, 1500);
  } else {
    clearInterval(playTimer);
    playIcon.textContent = '▶';
    playLabel.textContent = 'Reproducir';
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft')  prev();
});

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Init
document.getElementById('frameTotal').textContent = frames.length;
document.getElementById('progress').max = frames.length - 1;
renderFrame(0);