// js/utils/cpp_source.js  –  v4.1  (js/test.js compara este código con ../avl.h: si cambias uno, el test avisa)
// =====================================================================
// Código C++ del avl.h con todas las funciones + constructor del Nodo
// Cada línea incluye metadata de token para resaltado preciso
// =====================================================================

const RAW = {

  // ── NodoBST – constructor ─────────────────────────────────────────
  constructor_nodo: [
    "template <typename K, typename V = K>",
    "struct NodoBST {",
    "    K    clave;             // clave de orden",
    "    V    valor;             // dato asociado",
    "    unique_ptr<NodoBST> izq, der;  // hijos",
    "    int  altura;            // altura del subárbol",
    "",
    "    explicit NodoBST(K k, V v = V{})",
    "        : clave(std::move(k)),",
    "          valor(std::move(v)),",
    "          izq(nullptr),",
    "          der(nullptr),",
    "          altura(1) {",
    "        // hoja recién creada → altura = 1",
    "    }",
    "};"
  ],

  contador_rotaciones: [
    "inline int contador_rotaciones = 0;"
  ],

  // ── altura ───────────────────────────────────────────────────────
  altura: [
    "template <typename K, typename V>",
    "int altura(const unique_ptr<NodoBST<K,V>>& n) {",
    "    return n ? n->altura : 0;",
    "    // árbol vacío → altura 0",
    "}"
  ],

  // ── factor_balance ───────────────────────────────────────────────
  factor_balance: [
    "template <typename K, typename V>",
    "int factor_balance(",
    "        const unique_ptr<NodoBST<K,V>>& n) {",
    "    // fb = h(der) − h(izq)",
    "    // AVL válido ⟺ fb ∈ {−1, 0, 1}",
    "    return n",
    "        ? altura(n->der) - altura(n->izq)",
    "        : 0;",
    "}"
  ],

  // ── actualizar_altura ────────────────────────────────────────────
  actualizar_altura: [
    "template <typename K, typename V>",
    "void actualizar_altura(",
    "        unique_ptr<NodoBST<K,V>>& n) {",
    "    if (n)",
    "        n->altura =",
    "            1 + std::max(altura(n->izq),",
    "                         altura(n->der));",
    "}"
  ],

  // ── rotar_derecha (caso LL) ───────────────────────────────────────
  rotar_derecha: [
    "//       z              y",
    "//      / \\           /   \\",
    "//     y   T4  ⟹   x     z",
    "//    / \\           / \\   / \\",
    "//   x   T3        T1 T2 T3 T4",
    "void rotar_derecha(unique_ptr<Nodo>& z) {",
    "    auto y     = std::move(z->izq);",
    "    z->izq     = std::move(y->der);  // T3 → z",
    "    actualizar_altura(z);",
    "    y->der     = std::move(z);       // z cuelga de y",
    "    z          = std::move(y);       // y = nueva raíz",
    "    actualizar_altura(z);",
    "    ++contador_rotaciones;",
    "}"
  ],

  // ── rotar_izquierda (caso RR) ─────────────────────────────────────
  rotar_izquierda: [
    "//    z                  y",
    "//   / \\              /   \\",
    "//  T1  y    ⟹      z     x",
    "//     / \\          / \\   / \\",
    "//    T2  x        T1 T2 T3 T4",
    "void rotar_izquierda(unique_ptr<Nodo>& z) {",
    "    auto y     = std::move(z->der);",
    "    z->der     = std::move(y->izq);  // T2 → z",
    "    actualizar_altura(z);",
    "    y->izq     = std::move(z);       // z cuelga de y",
    "    z          = std::move(y);       // y = nueva raíz",
    "    actualizar_altura(z);",
    "    ++contador_rotaciones;",
    "}"
  ],

  // ── balancear (4 casos) ───────────────────────────────────────────
  balancear: [
    "void balancear(unique_ptr<Nodo>& n) {",
    "    actualizar_altura(n);",
    "    int fb = factor_balance(n);",
    "",
    "    if (fb > 1) {           // pesa a la DERECHA",
    "        if (factor_balance(n->der) < 0)",
    "            rotar_derecha(n->der);  // caso RL",
    "        rotar_izquierda(n);         // caso RR",
    "    }",
    "    else if (fb < -1) {     // pesa a la IZQUIERDA",
    "        if (factor_balance(n->izq) > 0)",
    "            rotar_izquierda(n->izq);// caso LR",
    "        rotar_derecha(n);           // caso LL",
    "    }",
    "    // |fb| ≤ 1 → ya está balanceado",
    "}"
  ],

  // ── insertar_avl ─────────────────────────────────────────────────
  insertar: [
    "void insertar_avl(",
    "        unique_ptr<Nodo>& raiz,",
    "        K clave, V valor = V{}) {",
    "    if (!raiz) {",
    "        raiz = make_unique<Nodo>(",
    "            std::move(clave),",
    "            std::move(valor));",
    "        return;  // hoja → no hay desbalance",
    "    }",
    "    if (clave < raiz->clave)",
    "        insertar_avl(raiz->izq,",
    "            std::move(clave), std::move(valor));",
    "    else if (clave > raiz->clave)",
    "        insertar_avl(raiz->der,",
    "            std::move(clave), std::move(valor));",
    "    else {",
    "        raiz->valor = std::move(valor); // clave duplicada",
    "        return;",
    "    }",
    "    balancear(raiz);  // ← al regresar",
    "}"
  ],

  // ── buscar ───────────────────────────────────────────────────────
  buscar: [
    "NodoBST* buscar(",
    "        const unique_ptr<Nodo>& raiz,",
    "        const K& clave) {",
    "    if (!raiz)               return nullptr;",
    "    if (clave == raiz->clave) return raiz.get();",
    "    if (clave < raiz->clave)",
    "        return buscar(raiz->izq, clave);",
    "    return buscar(raiz->der, clave);",
    "}"
  ],

  // ── minimo ───────────────────────────────────────────────────────
  minimo: [
    "NodoBST* minimo(",
    "        const unique_ptr<Nodo>& n) {",
    "    // el nodo más a la izquierda",
    "    return n->izq",
    "        ? minimo(n->izq)",
    "        : n.get();",
    "}"
  ],

  // ── eliminar_avl ─────────────────────────────────────────────────
  eliminar_avl: [
    "void eliminar_avl(",
    "        unique_ptr<Nodo>& raiz,",
    "        const K& clave) {",
    "    if (!raiz) return;",
    "    if (clave < raiz->clave)",
    "        eliminar_avl(raiz->izq, clave);",
    "    else if (clave > raiz->clave)",
    "        eliminar_avl(raiz->der, clave);",
    "    else {   // ← nodo encontrado",
    "        if (!raiz->izq && !raiz->der)",
    "            raiz = nullptr;             // hoja",
    "        else if (!raiz->izq) {",
    "            auto hijo = std::move(raiz->der);",
    "            raiz = std::move(hijo);",
    "        } else if (!raiz->der) {",
    "            auto hijo = std::move(raiz->izq);",
    "            raiz = std::move(hijo);",
    "        } else {",
    "            Nodo* suc    = minimo(raiz->der);",
    "            K clave_suc  = suc->clave;",
    "            raiz->clave  = clave_suc;",
    "            raiz->valor  = suc->valor;",
    "            eliminar_avl(raiz->der, clave_suc);",
    "        }",
    "    }",
    "    if (raiz) balancear(raiz);",
    "}"
  ],

  // ── imprimir_inorden ─────────────────────────────────────────────
  imprimir_inorden: [
    "// Recorrido INORDEN: izq → raíz → der",
    "// Resultado: claves en orden ascendente",
    "void imprimir_inorden(",
    "        const unique_ptr<Nodo>& n) {",
    "    if (!n) return;",
    "    imprimir_inorden(n->izq);",
    "    std::cout << n->clave << \" \";",
    "    imprimir_inorden(n->der);",
    "}"
  ],

  // ── imprimir_arbol (preorden / postorden visual) ──────────────────
  imprimir_arbol: [
    "// Dibuja el árbol 'de lado'",
    "// (raíz a la izquierda, hijo der arriba)",
    "void imprimir_arbol(",
    "        const unique_ptr<Nodo>& n,",
    "        int nivel = 0) {",
    "    if (!n) return;",
    "    imprimir_arbol(n->der, nivel + 1);",
    "    cout << string(nivel*6,' ')",
    "         << n->clave",
    "         << \" (h=\" << n->altura",
    "         << \", fb=\" << factor_balance(n)",
    "         << \")\\n\";",
    "    imprimir_arbol(n->izq, nivel + 1);",
    "}"
  ],
  // ── imprimir_preorden ────────────────────────────────────────────
  imprimir_preorden: [
    "// Recorrido PREORDEN: raíz → izq → der",
    "void imprimir_preorden(",
    "        const unique_ptr<Nodo>& n) {",
    "    if (!n) return;",
    "    std::cout << n->clave << \" \";",
    "    imprimir_preorden(n->izq);",
    "    imprimir_preorden(n->der);",
    "}"
  ],

  // ── imprimir_postorden ───────────────────────────────────────────
  imprimir_postorden: [
    "// Recorrido POSTORDEN: izq → der → raíz",
    "void imprimir_postorden(",
    "        const unique_ptr<Nodo>& n) {",
    "    if (!n) return;",
    "    imprimir_postorden(n->izq);",
    "    imprimir_postorden(n->der);",
    "    std::cout << n->clave << \" \";",
    "}"
  ],

  // ── maximo ───────────────────────────────────────────────────────
  maximo: [
    "NodoBST* maximo(",
    "        const unique_ptr<Nodo>& n) {",
    "    // el nodo más a la derecha",
    "    return n->der",
    "        ? maximo(n->der)",
    "        : n.get();",
    "}"
  ],
};

// ── Metadatos de cada función (badge + color) ──────────────────────
export const FN_META = {
  constructor_nodo:   { label:'NodoBST()',          badge:'badge-purple', tab:'Constructor' },
  contador_rotaciones:{ label:'contador_rotaciones', badge:'badge-purple', tab:'Contador' },
  altura:             { label:'altura()',            badge:'badge-teal',   tab:'Medición' },
  factor_balance:     { label:'factor_balance()',   badge:'badge-teal',   tab:'Medición' },
  actualizar_altura:  { label:'actualizar_altura()',badge:'badge-teal',   tab:'Medición' },
  rotar_derecha:      { label:'rotar_derecha()',    badge:'badge-purple', tab:'Rotación' },
  rotar_izquierda:    { label:'rotar_izquierda()',  badge:'badge-purple', tab:'Rotación' },
  balancear:          { label:'balancear()',         badge:'badge-amber',  tab:'Balance' },
  insertar:           { label:'insertar_avl()',    badge:'badge-blue',   tab:'Insertar', call:[0,1,2], nulo:[3], crear:[4,5,6], ret:[7], menor:[9], izq:[10,11],
                        mayor:[12], der:[13,14], dup:[15,16,17], bal:[19] },
  buscar:             { label:'buscar()',            badge:'badge-green',  tab:'Buscar' },
  minimo:             { label:'minimo()',            badge:'badge-teal',   tab:'Mínimo' },
  eliminar_avl:       { label:'eliminar_avl()',    badge:'badge-red',    tab:'Eliminar', call:[0,1,2], nulo:[3], menor:[4], izq:[5], mayor:[6], der:[7], hallado:[8],
                        hoja:[9,10], hijoDer:[11,12], movDer:[13], hijoIzq:[14,15], movIzq:[16], dos:[17],
                        suc:[18], cs:[19], ck:[20,21], rec:[22], bal:[25] },
  imprimir_inorden:   { label:'imprimir_inorden()', badge:'badge-green',  tab:'Inorden' },
  imprimir_preorden:  { label:'imprimir_preorden()',  badge:'badge-green',  tab:'Preorden' },
  imprimir_postorden: { label:'imprimir_postorden()', badge:'badge-green',  tab:'Postorden' },
  maximo:             { label:'maximo()',            badge:'badge-teal',   tab:'Máximo' },
  imprimir_arbol:     { label:'imprimir_arbol()',   badge:'badge-green',  tab:'Árbol' },
};

// ── TAGS: etiqueta → líneas (índice 0) que se ejecutan en ese paso ──────────
// El motor (AVLTree.js) pide etiquetas por nombre, nunca números sueltos:
// si una etiqueta no existe lanza un error, así el resaltado no puede desfasarse.
const RAW_TAGS = {
  constructor_nodo:   { init: [7,8,9,10,11,12] },
  altura:             { ret: [2] },
  actualizar_altura:  { call: [1,2], calc: [3,4,5,6] },
  factor_balance:     { call: [1,2], calc: [5,6,7] },
  rotar_derecha:      { call:[5], y:[6], t3:[7], h1:[8], yz:[9], root:[10], h2:[11], cnt:[12] },
  rotar_izquierda:    { call:[5], y:[6], t3:[7], h1:[8], yz:[9], root:[10], h2:[11], cnt:[12] },
  balancear:          { call:[0], h:[1], fb:[2], gtR:[4], rlCheck:[5], RL:[6], RR:[7],
                        ltL:[9], lrCheck:[10], LR:[11], LL:[12], ok:[15] },
  insertar:           { call:[0,1,2], nulo:[3], crear:[4,5,6], ret:[7], menor:[9], izq:[10,11],
                        mayor:[12], der:[13,14], dup:[15,16,17], bal:[19] },
  buscar:             { call:[0,1,2], nulo:[3], igual:[4], menor:[5], izq:[6], der:[7] },
  minimo:             { cond:[3], baja:[4], fin:[5] },
  maximo:             { cond:[3], baja:[4], fin:[5] },
  eliminar_avl:       { call:[0,1,2], nulo:[3], menor:[4], izq:[5], mayor:[6], der:[7], hallado:[8],
                        hoja:[9,10], hijoDer:[11,12], movDer:[13], hijoIzq:[14,15], movIzq:[16], dos:[17],
                        suc:[18], cs:[19], ck:[20,21], rec:[22], bal:[25] },
  imprimir_inorden:   { call:[2,3], nulo:[4], izq:[5], visita:[6], der:[7] },
  imprimir_preorden:  { call:[1,2], nulo:[3], visita:[4], izq:[5], der:[6] },
  imprimir_postorden: { call:[1,2], nulo:[3], izq:[4], der:[5], visita:[6] },
};

// ── Se muestra el C++ SIN comentarios; las etiquetas se ajustan a las líneas que quedan ──
const isComment = l => /^\s*\/\//.test(l);
const MAP = {};
export const CPP_SOURCE = {};
for (const [f, arr] of Object.entries(RAW)) {
  let n = 0; MAP[f] = arr.map(l => isComment(l) ? -1 : n++);
  CPP_SOURCE[f] = arr.filter(l => !isComment(l)).map(l => l.replace(/\s*\/\/.*$/, ''));
}
export const TAGS = {};
for (const [f, tags] of Object.entries(RAW_TAGS))
  TAGS[f] = Object.fromEntries(Object.entries(tags).map(([t, ls]) => [t, ls.map(i => MAP[f][i]).filter(i => i >= 0)]));

// Orden de las pestañas = orden del esquema de avl.h (las 3 últimas son extras del simulador)
export const FN_ORDER = ['constructor_nodo', 'contador_rotaciones', 'altura', 'factor_balance', 'actualizar_altura',
  'rotar_derecha', 'rotar_izquierda', 'balancear', 'insertar', 'buscar', 'minimo', 'eliminar_avl',
  'imprimir_inorden', 'imprimir_arbol', 'imprimir_preorden', 'imprimir_postorden', 'maximo'];
