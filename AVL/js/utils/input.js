// js/utils/input.js — interpreta el cuadro de claves: "7", "10,20,30", "1..15", "5 3 -2..2"
export const KEY_MIN = -9999, KEY_MAX = 9999;

export function parseKeys(text, { maxCount = 255 } = {}) {
  const src = String(text ?? '').trim();
  if (!src) return { error: 'Escribe una clave o una lista (10,20,30 · 1..15)' };
  const keys = [];
  for (const tok of src.split(/[\s,;]+/).filter(Boolean)) {
    const m = /^(-?\d{1,4})(?:\.\.(-?\d{1,4}))?$/.exec(tok);
    if (!m) return { error: `"${tok}" no vale: usa enteros entre −9999 y 9999 (ej. 10,20,30 o 1..15, sin espacios dentro del rango)` };
    const a = Number(m[1]) + 0, b = m[2] === undefined ? a : Number(m[2]) + 0;   // "+ 0" convierte -0 en 0
    if (keys.length + Math.abs(b - a) + 1 > maxCount) return { error: `Demasiadas claves (máximo ${maxCount} por operación)` };
    const step = b >= a ? 1 : -1;
    for (let k = a; step > 0 ? k <= b : k >= b; k += step) keys.push(k);
  }
  return { keys };
}
