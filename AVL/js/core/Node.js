// js/core/Node.js

let nextId = 0;   // contador de ids: únicos y reproducibles (los tests no dependen del azar)

export class Node {
    // name: nombre obligatorio y único del nodo (A, B, ...). Es la identidad visible del nodo:
    // viaja con él aunque una rotación lo cambie de posición.
    constructor(key, value = null, name = '') {
        const n = ++nextId;
        this.id = `n${n}`;
        this.name = name;
        this.hue = Math.round((n * 137.508) % 360);   // color propio (ángulo áureo: nodos vecinos se distinguen)
        this.key = key;
        this.value = value ?? key;

        this.left = null;
        this.right = null;
        this.height = 1;

        // NUEVO: Para el visualizador v2.0
        this.isFloating = false; // true si está en una variable (ej. 'y') y no en el árbol
        this.floatingIn = null;  // Nombre de la variable donde flota (ej. 'y', 'T3')
    }

    isLeaf() {
        return this.left === null && this.right === null;
    }
}
