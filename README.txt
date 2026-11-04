PRACTICA S10 - ARBOLES AVL
SIS210 Algoritmos y Estructuras de Datos - UNAP 2026-II
Alumno: Oly Aimar Vilca Chani

=====================================================================
1. CONTENIDO
=====================================================================
avl.h           AVL en C++17: rotaciones, balancear, insertar_avl, eliminar_avl
avl_main.cpp    Tests P1-P6 de la guia + extras P7-P9 (LL, RL, estres)
avl_python.py   AVL en Python: experimento BST vs AVL (2B) y SIGA-UNAP-AVL (3)
README.txt      Este archivo

=====================================================================
2. COMO COMPILAR Y EJECUTAR
=====================================================================
C++17:
    g++ -std=c++17 avl_main.cpp -o avl_main
    ./avl_main            (en Windows: avl_main.exe)

Python 3.12+:
    python avl_python.py
  Primero imprime la tabla del experimento (2B) y luego abre el menu
  del SIGA-UNAP-AVL (opciones 1 a 5). El BST con 10000 claves ordenadas
  hace unos 50 millones de llamadas recursivas, por lo que la tabla puede
  tardar algunos segundos.

=====================================================================
3. RESPUESTAS - ACTIVIDAD 1
=====================================================================
P1-A (insertar 10, 20, 30):
  Ocurre 1 rotacion simple a la izquierda (caso RR). La raiz queda en 20
  con hijos 10 y 30. El test lo confirma con contador_rotaciones == 1.

P1-B (insertar 30, 10, 20):
  Ocurre 1 rotacion doble de tipo LR, equivalente a 2 rotaciones simples:
  primero rotar_izquierda sobre 10 y luego rotar_derecha sobre 30.
  La raiz queda en 20. El test lo confirma con contador_rotaciones == 2.

P1-C (altura maxima de un AVL con 15 nodos):
  El minimo de nodos para altura h cumple N(h) = N(h-1) + N(h-2) + 1:
  N(1)=1, N(2)=2, N(3)=4, N(4)=7, N(5)=12, N(6)=20.
  Como 12 <= 15 < 20, la altura maxima de un AVL con 15 nodos es 5.
  P3 acepta h <= 4 porque insertar 1..15 en orden produce un arbol perfecto
  (2^4 - 1 = 15 nodos) cuya altura es 4, la minima posible. Es el resultado
  de ese orden de insercion concreto, no el peor caso de un AVL.

=====================================================================
4. RESPUESTAS - ACTIVIDAD 2B
=====================================================================
Resultados de la ejecucion (semilla fija random.seed(2026)):

        n | BST (ord) | AVL (ord) | Teorico | BST (rnd) | AVL (rnd)
      100 |       100 |         7 |       9 |        12 |         8
      500 |       500 |         9 |      12 |        18 |        11
     1000 |      1000 |        10 |      14 |        20 |        12
     5000 |      5000 |        13 |      17 |        27 |        15
    10000 |     10000 |        14 |      19 |        29 |        16

P2B-A:
  Con insercion ordenada, la altura del BST es igual al numero de nodos n
  (100 -> 100, ..., 10000 -> 10000). El arbol se degenera en una lista
  enlazada y cada busqueda o insercion cuesta O(n).

P2B-B:
  El limite teorico es 1.44 * log2(10001) = 19.13 (el codigo lo trunca a 19).
  El AVL con n = 10000 NO lo supera: mide 14 con claves ordenadas y 16 con
  claves aleatorias, es decir 5 y 3 niveles por debajo del limite.

P2B-C:
  Las alturas no son exactamente iguales (14 vs 16 para n = 10000), pero ambas
  son del orden de log n. En un AVL la altura esta acotada por el invariante
  |fb| <= 1, que se restablece con rotaciones despues de cada insercion sin
  importar el orden de las claves. La insercion ordenada suele dar un arbol
  casi perfecto (altura minima) y la aleatoria queda algo mas alta, pero
  nunca por encima de 1.44 * log2(n + 2).

=====================================================================
5. ACTIVIDAD 3 - SIGA-UNAP-AVL
=====================================================================
Menu: 1 Matricular, 2 Buscar por codigo (muestra el tiempo en microsegundos),
3 Listar todos (recorrido inorden, ordenado por codigo), 4 Estadisticas
(altura actual vs altura teorica), 5 Salir. Se cargan 10 estudiantes de muestra
al iniciar. Si se matricula un codigo repetido, se actualizan los datos y no se
cuenta como estudiante nuevo.
