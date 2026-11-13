# Simulador AVL — v9 (Vue 3, sin build)

Debugger visual paso a paso del `avl.h` (SIS210). El motor graba un fotograma por línea ejecutada y la interfaz los reproduce.

## Ejecutar
Los módulos ES no funcionan abriendo `index.html` con doble clic; hace falta un servidor local:

- **Windows:** doble clic en `servir.bat` (o `py -m http.server 8000`) y abre <http://localhost:8000>.
- **Sin Internet:** una sola vez, con Internet, ejecuta `node tools/fetch-vue.mjs`. Guarda Vue en `js/vendor/` y desde entonces no se usa el CDN. Si esa carpeta no existe, se carga Vue desde jsDelivr.

## Uso
- Cuadro de claves: un entero (`7`), una lista (`10,20,30`) o un rango (`1..15`) para **Insertar** / **Eliminar**. *Buscar* acepta una sola clave. El campo *Valor* solo vale con una clave.
- **📋 Casos de la guía:** P1–P6 de `avl_main.cpp` y los extras P7–P8. Cargan el escenario, lo ejecutan paso a paso y comprueban lo mismo que los `assert` del C++.
- Pasos como en un debugger: **▶ Entrar** (`→`), **Saltar ↓** (pasa por encima de la llamada actual, p. ej. una recursión o `actualizar_altura`) y **Salir ↑** (termina la función en la que estás). `Espacio` play/pausa · `←` paso atrás · `Inicio` `Fin`.
- **detalle:** al entrar en `actualizar_altura()` y `factor_balance()` verás sus líneas ejecutarse (el cambio de `n->altura` ocurre ahí dentro). Desmárcalo para ver solo el flujo de alto nivel.
- Límites: 255 nodos como máximo; en listas de más de 32 claves solo se anima la última operación (las demás se ejecutan en silencio).

## Pruebas
```
node js/test.js              # motor, panel de código == avl.h, casos de la guía, listas, lotes
node tools/compare_cpp.mjs   # motor JS vs avl.h REAL compilado con g++ (12 000 operaciones)
```

## Novedades de v9 — nombres de nodo
- **Cada nodo tiene un nombre obligatorio y único** (A, B, `Ana`…; letras, números y `_`, máx. 10). Al pulsar **Insertar** aparece una ventanita que pide el nombre de cada clave nueva (también con listas y rangos; las claves que ya existen no piden nombre). Los casos de la guía y el ejemplo usan A, B, C… automáticamente.
- **El nombre viaja con el nodo** y la **raíz es dinámica**: el nodo de arriba muestra la marca `RAÍZ`, que cambia de nodo con las rotaciones.
- **El C++ del panel usa los nombres**: donde el código dice `raiz`, `n`, `z`, `y`, `suc` o `hijo` verás una píldora con el nombre del nodo al que apunta en ese paso (`raiz->izq` → `B->izq`). En la recursión, la llamada interna muestra el hijo (`insertar_avl(B->izq…)` → `C`). Si el parámetro es un hueco vacío se ve `D->izq` (discontinuo), y en el árbol vacío `raiz`.
- Barra **«en esta llamada»** bajo las pestañas (`raiz ▸ B`, `y ▸ C`…) y casilla **nombres** para volver al código original.
- La **pila de llamadas** y las descripciones usan los nombres; `minimo()`/`maximo()` bajan con una llamada por nivel, como la recursión del C++.
- **Panel de código ajustable en ancho**: arrastra la barra entre el código y el árbol (también con `←`/`→` sobre la barra; doble clic o `Inicio` = 340 px). El ancho se recuerda.
- Arreglado: las pestañas/insignias de `insertar_avl()` y `eliminar_avl()` no tenían etiqueta.
- El texto C++ base sigue siendo el de `avl.h` (el test lo vigila); los nombres se aplican solo al dibujar.

## Novedades de v8
- Entrar / Saltar / Salir y `actualizar_altura()` / `factor_balance()` ejecutados paso a paso (con interruptor *detalle*).
- Los avances de v7 siguen igual (abajo).

## Novedades de v7
- Casos de la guía y entrada por listas/rangos.
- Arreglado: el botón **Ejemplo** lanzaba un error (`recordEvent` no existía).
- Arreglado: **Reiniciar** no ponía a 0 el contador de rotaciones.
- El panel de código es el de `avl.h` (eliminar con un hijo ahora muestra `auto hijo = std::move(...)`; `insertar_avl` con `std::move`). Un test lo vigila.
- Ids de nodo con contador (tests reproducibles), versión unificada, límite de nodos y menos trabajo por operación.
- Diseño adaptable (< 900 px).
