// js/utils/layout.js — layout por ancho de subárbol: el padre queda centrado sobre sus hijos
export class TreeLayout {
  static calculatePositions(root, nodeWidth = 100, nodeHeight = 80) {
    const treePositions = {}, SLOT = nodeWidth + 40, Y = nodeHeight + 50;
    let maxDepth = 0;
    // devuelve {w, cx}: ancho en "casillas" y centro del nodo, ambos relativos a x0
    const lay = (n, d, x0) => {
      if (!n) return { w: 0 };
      maxDepth = Math.max(maxDepth, d);
      const L = lay(n.left, d + 1, x0), R = lay(n.right, d + 1, x0 + L.w);
      let w, cx;
      if (L.w && R.w) { w = L.w + R.w; cx = (L.cx + R.cx) / 2; }
      else if (L.w)   { w = L.w + .5;  cx = L.cx + .5; }
      else if (R.w)   { w = R.w + .5;  cx = R.cx - .5; if (cx < x0 + .5) { cx = x0 + .5; } w = Math.max(w, 1); }
      else            { w = 1; cx = x0 + .5; }
      treePositions[n.id] = { x: (cx - .5) * SLOT, y: d * Y };
      return { w, cx };
    };
    const r = lay(root, 0, 0);
    return { treePositions, totalWidth: r.w * SLOT, maxDepth };
  }
}
