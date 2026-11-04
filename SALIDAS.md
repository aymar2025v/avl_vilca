# parte c++

```bash
PS D:\ALGORITMO Y ESTRUCTURA\SEMANA10\practica_s10_vilca\avl_vilca> g++ -std=c++17 avl_main.cpp -o avl_main                                
PS D:\ALGORITMO Y ESTRUCTURA\SEMANA10\practica_s10_vilca\avl_vilca> ./avl_main.exe             
[P1 OK] insercion_simple  (rotaciones = 1, tipo RR)
      30 (h=1, fb=0)
20 (h=2, fb=0)
      10 (h=1, fb=0)
[P2 OK] caso_LR  (rotaciones simples = 2, tipo LR = 1 doble)
      30 (h=1, fb=0)
20 (h=2, fb=0)
      10 (h=1, fb=0)
[P3 OK] insercion_ordenada_grande h=4
        inorden: 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 
[P4 OK] eliminar_hoja
[P5 OK] eliminar_raiz_dos_hijos  (raiz 20 -> 25)
            35 (h=1, fb=0)
      30 (h=2, fb=1)
25 (h=3, fb=1)
      10 (h=1, fb=0)
[P6 OK] eliminar_con_rebalanceo  (h antes = 3, h despues = 3)
[P7 OK] caso_LL (extra)
[P8 OK] caso_RL (extra)
[P9 OK] estres_aleatorio (extra)  h final = 12
=== Todos los casos P1-P6 (y extras P7-P9) pasaron ===
PS D:\ALGORITMO Y ESTRUCTURA\SEMANA10\practica_s10_vilca\avl_vilca> 
```

# parte python

```bash
PS D:\ALGORITMO Y ESTRUCTURA\SEMANA10\practica_s10_vilca\avl_vilca> python avl_python.py
===== ACTIVIDAD 2B: BST vs AVL =====
       n |  BST (ord) |  AVL (ord) |    Teorico |  BST (rnd) |  AVL (rnd)
--------------------------------------------------------------------
     100 |        100 |          7 |          9 |         12 |          8
     500 |        500 |          9 |         12 |         18 |         11
    1000 |       1000 |         10 |         14 |         20 |         12
    5000 |       5000 |         13 |         17 |         27 |         15
   10000 |      10000 |         14 |         19 |         29 |         16

===== ACTIVIDAD 3: SIGA-UNAP-AVL =====
Cargando 10 estudiantes...
  Matriculado Ana Quispe en 6.20 us
  Matriculado Luis Mamani en 14.70 us
  Matriculado Rosa Condori en 13.00 us
  Matriculado Ivan Huanca en 8.50 us
  Matriculado Maria Apaza en 16.20 us
  Matriculado Carlos Tito en 14.10 us
  Matriculado Lucia Ramos en 11.60 us
  Matriculado Pedro Vargas en 14.50 us
  Matriculado Sofia Luna en 11.90 us
  Matriculado Juan Puma en 18.30 us

=== SIGA-UNAP-AVL ===
1. Matricular nuevo estudiante
2. Buscar por codigo
3. Listar todos (inorden)
4. Estadisticas del arbol
5. Salir
Opcion: 1
  Codigo: 2026100012
  Nombre: Aymar Vilca
  Escuela: Sistemas
  Promedio: 14
  Matriculado Aymar Vilca en 35.80 us

=== SIGA-UNAP-AVL ===
1. Matricular nuevo estudiante
2. Buscar por codigo
3. Listar todos (inorden)
4. Estadisticas del arbol
5. Salir
Opcion: 3
  Codigo       Nombre           Escuela    Promedio
  --------------------------------------------------
  2026100001   Ana Quispe       Sistemas      15.50
  2026100002   Luis Mamani      Sistemas      14.00
  2026100003   Rosa Condori     IA&CD         17.20
  2026100004   Ivan Huanca      Sistemas      13.80
  2026100005   Maria Apaza      IA&CD         16.90
  2026100006   Carlos Tito      Sistemas      12.10
  2026100007   Lucia Ramos      IA&CD         18.00
  2026100008   Pedro Vargas     Sistemas      15.00
  2026100009   Sofia Luna       IA&CD         16.40
  2026100010   Juan Puma        Sistemas      14.70
  2026100012   Aymar Vilca      Sistemas      14.00

=== SIGA-UNAP-AVL ===
1. Matricular nuevo estudiante
2. Buscar por codigo
3. Listar todos (inorden)
4. Estadisticas del arbol
5. Salir
Opcion: 4
  Total estudiantes: 11
  Altura AVL actual: 4
  Altura teorica max: 5
  Eficiencia: OPTIMO

=== SIGA-UNAP-AVL ===
1. Matricular nuevo estudiante
2. Buscar por codigo
3. Listar todos (inorden)
4. Estadisticas del arbol
5. Salir
Opcion: 2
  Codigo: 2026100012
  Encontrado: EstudianteUNAP(codigo='2026100012', nombre='Aymar Vilca', escuela='Sistemas', promedio=14.0)  (12.20 us)

=== SIGA-UNAP-AVL ===
1. Matricular nuevo estudiante
2. Buscar por codigo
3. Listar todos (inorden)
4. Estadisticas del arbol
5. Salir
Opcion: 5
PS D:\ALGORITMO Y ESTRUCTURA\SEMANA10\practica_s10_vilca\avl_vilca> 
```