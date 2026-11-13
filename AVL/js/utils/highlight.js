// js/utils/highlight.js — resaltado de sintaxis C++ (extraído de CodePanel.js)
const KW_RE  = /\b(void|auto|int|bool|char|return|if|else|while|for|do|struct|template|typename|explicit|inline|const|constexpr|nullptr|true|false|this|std::move|std::max|std::min|std::string|std::cout|make_unique|sizeof|static|virtual|override|public|private|protected|class|namespace|using|typedef)\b/g;
const TY_RE  = /\b(unique_ptr|shared_ptr|NodoBST|Nodo|Node|K|V|T|size_t|uint32_t|string|ostream|istream|pair)\b/g;
const NUM_RE = /\b(\d+)\b/g;
const PTR_RE = /(->|::|\.\.\.|<=|>=|!=|==|\+=|-=)/g;
const OP_RE  = /([{}();,])/g;
const CMT_RE = /(\/\/[^\n]*)/g;
const STR_RE = /("(?:[^"\\]|\\.)*")/g;

export function highlight(raw) {
  // Escapar HTML
  let s = raw
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');

  // Orden importa: comentarios primero para no tocar su contenido
  s = s.replace(CMT_RE, m => `\x01CMT\x02${m}\x03`);
  s = s.replace(STR_RE, m => `\x01STR\x02${m}\x03`);
  s = s.replace(KW_RE,  m => `\x01KW\x02${m}\x03`);
  s = s.replace(TY_RE,  m => `\x01TY\x02${m}\x03`);
  s = s.replace(PTR_RE, m => `\x01PTR\x02${m}\x03`);
  s = s.replace(NUM_RE, m => `\x01NUM\x02${m}\x03`);
  // s = s.replace(OP_RE,  m => `\x01OP\x02${m}\x03`);

  // Sustituir marcadores
  s = s.replace(/\x01CMT\x02(.*?)\x03/g, '<span class="cmt">$1</span>');
  s = s.replace(/\x01STR\x02(.*?)\x03/g, '<span class="str">$1</span>');
  s = s.replace(/\x01KW\x02(.*?)\x03/g,  '<span class="kw">$1</span>');
  s = s.replace(/\x01TY\x02(.*?)\x03/g,  '<span class="ty">$1</span>');
  s = s.replace(/\x01PTR\x02(.*?)\x03/g, '<span class="ptr">$1</span>');
  s = s.replace(/\x01NUM\x02(.*?)\x03/g, '<span class="num">$1</span>');

  return s;
}

// ── v9: nombres de nodo dentro del C++ ──
// Variables del C++ que apuntan a un nodo. En cada paso se sustituyen por el nombre del nodo al que apuntan
// (p. ej. "raiz->izq" → "B->izq"); los textos entre cadenas ("...") no se tocan.
export const NODE_VARS = ['raiz', 'n', 'z', 'y', 'suc', 'hijo'];
const VAR_RE = new RegExp(`("(?:[^"\\\\]|\\\\.)*"|\\b(?:${NODE_VARS.join('|')})\\b)`);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Píldora con el nombre del nodo (color propio) o del hueco vacío ("A->izq", discontinua).
export function pill(varName, b) {
  const tip = b.slot !== undefined ? `${varName} es el hueco ${b.slot} (nullptr)` : `${varName} apunta al nodo ${b.name} (clave ${b.key})`;
  return b.slot !== undefined
    ? `<span class="np slot" title="${esc(tip)}">${esc(b.slot)}</span>`
    : `<span class="np" style="--h:${b.hue}" title="${esc(tip)}">${esc(b.name)}</span>`;
}

// bind: { raiz: {name, hue, key} | {slot}, ... }. Sin bind (o variable sin enlace) se deja el texto original.
// Con nombres, el relleno de espacios que alinea los "=" del .h ya no alinea nada (las píldoras miden distinto):
// se colapsa a un espacio, salvo la sangría del principio y el texto entre comillas.
export function renderCode(raw, bind) {
  if (!bind) return highlight(raw);
  const indent = /^\s*/.exec(raw)[0];
  return raw.slice(indent.length).split(VAR_RE)
    .map((tok, i) => i % 2 ? (bind[tok] ? pill(tok, bind[tok]) : highlight(tok)) : highlight(tok.replace(/ {2,}/g, ' ')))
    .join('').replace(/^/, indent);
}

