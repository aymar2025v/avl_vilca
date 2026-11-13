// js/utils/stepping.js — Paso sobre / Salir, usando la profundidad de la pila de llamadas de cada fotograma.
//   Entrar  = el fotograma siguiente (▶).
//   Saltar  = siguiente fotograma al mismo nivel (o menos): se salta lo que ocurre DENTRO de la llamada actual.
//   Salir   = siguiente fotograma con un nivel menos: se termina la función en la que estás.
const depth = f => f.debug.stack.length;

export function stepOverIndex(frames, i) {
  if (!frames[i]) return i;
  const d = depth(frames[i]), j = frames.findIndex((f, k) => k > i && depth(f) <= d);
  return j >= 0 ? j : frames.length - 1;
}
export function stepOutIndex(frames, i) {
  if (!frames[i]) return i;
  const d = depth(frames[i]), j = frames.findIndex((f, k) => k > i && depth(f) < d);
  return j >= 0 ? j : frames.length - 1;
}
