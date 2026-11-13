// js/utils/names.js — nombres de nodo: validación y sugerencias (A, B, C … Z, AA, AB …)
export const NAME_MAX = 10;
const NAME_RE = new RegExp(`^[A-Za-z_][A-Za-z0-9_]{0,${NAME_MAX - 1}}$`);

// Identificadores del C++ del panel: si un nodo se llamara "y" o "raiz" el código sería ilegible.
const RESERVED = new Set(['raiz', 'n', 'z', 'y', 'suc', 'hijo', 'T2', 'T3', 'K', 'V', 'T', 'nullptr', 'clave', 'valor',
  'izq', 'der', 'altura', 'fb', 'auto', 'int', 'void', 'return', 'if', 'else', 'true', 'false', 'this', 'struct',
  'std', 'Nodo', 'NodoBST']);

const norm = s => String(s).toLowerCase();

// Conjunto (en minúsculas) con los nombres ya usados: "A" y "a" cuentan como el mismo.
export const nameSet = names => new Set([...names].map(norm));

// '' si el nombre vale; si no, el motivo. taken = nameSet(...) de los nombres ocupados.
export function validateName(raw, taken = new Set()) {
  const name = String(raw ?? '').trim();
  if (!name) return 'Escribe un nombre';
  if (!NAME_RE.test(name)) return `Usa letras, números o _ (empieza con letra, máx. ${NAME_MAX})`;
  if (RESERVED.has(name)) return `"${name}" es una palabra del código C++`;
  if (taken.has(norm(name))) return `"${name}" ya está en uso`;
  return '';
}

const SKIP = new Set(['K', 'V', 'T']);   // se confunden con los tipos de la plantilla
function* generator() {
  for (let i = 0; ; i++) {
    let s = '', k = i;
    do { s = String.fromCharCode(65 + (k % 26)) + s; k = Math.floor(k / 26) - 1; } while (k >= 0);
    if (!SKIP.has(s)) yield s;
  }
}
// Siguientes `count` nombres libres: A, B, C …
export function suggestNames(taken, count) {
  const used = new Set(taken), out = [];
  for (const s of generator()) {
    if (out.length >= count) break;
    if (!used.has(norm(s)) && !validateName(s, used)) { out.push(s); used.add(norm(s)); }
  }
  return out;
}
