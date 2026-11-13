// =====================================================================
// avl_main.cpp  -  Programa de prueba del AVL (casos P1-P6 de la guia
//                  + casos extra P7-P9)
// Compilar:  g++ -std=c++17 avl_main.cpp -o avl_main
// Ejecutar:  ./avl_main
// =====================================================================
#include <iostream>
#include <cassert>
#include <cstdlib> // std::abs
#include <vector>
#include <random>
#include "avl.h"

// Funcion auxiliar: retorna la altura del arbol
template <typename K, typename V>
int h(const std::unique_ptr<NodoBST<K, V>> &r) { return r ? r->altura : 0; }

// ---------------------------------------------------------------------
// Verificadores extra: comprueban que el arbol sea AVL de verdad
// ---------------------------------------------------------------------

// Comprueba que la altura guardada sea la real y que |fb| <= 1 en todos los nodos
template <typename K, typename V>
bool es_avl(const std::unique_ptr<NodoBST<K, V>> &n, int &alt)
{
    if (!n)
    {
        alt = 0;
        return true;
    }
    int ai = 0, ad = 0;
    if (!es_avl(n->izq, ai) || !es_avl(n->der, ad))
        return false;
    alt = 1 + std::max(ai, ad);
    return alt == n->altura && std::abs(ad - ai) <= 1;
}

// Guarda las claves en inorden dentro de un vector
template <typename K, typename V>
void recolectar(const std::unique_ptr<NodoBST<K, V>> &n, std::vector<K> &v)
{
    if (!n)
        return;
    recolectar(n->izq, v);
    v.push_back(n->clave);
    recolectar(n->der, v);
}

// AVL valido y ademas con propiedad BST (inorden estrictamente creciente)
template <typename K, typename V>
bool arbol_valido(const std::unique_ptr<NodoBST<K, V>> &r)
{
    int alt = 0;
    if (!es_avl(r, alt))
        return false;
    std::vector<K> v;
    recolectar(r, v);
    for (size_t i = 1; i < v.size(); ++i)
        if (!(v[i - 1] < v[i]))
            return false;
    return true;
}

// ---------------------------------------------------------------------
// Actividad 1: casos P1-P3
// ---------------------------------------------------------------------
void test_P1_insercion_simple()
{
    // Insertar 3 claves ordenadas - en BST seria h=3; en AVL h=2
    std::unique_ptr<NodoBST<int, int>> r = nullptr;
    contador_rotaciones = 0;
    insertar_avl(r, 10, 10);
    insertar_avl(r, 20, 20);
    insertar_avl(r, 30, 30); // provoca rotacion RR (rotar_izquierda)
    assert(h(r) == 2 && "P1: altura debe ser 2 tras RR rotation");
    assert(r->clave == 20 && "P1: raiz debe ser 20");
    assert(contador_rotaciones == 1 && "P1: debe ocurrir 1 rotacion simple");
    std::cout << "[P1 OK] insercion_simple  (rotaciones = "
              << contador_rotaciones << ", tipo RR)" << std::endl;
    imprimir_arbol(r);
}

void test_P2_caso_LR()
{
    std::unique_ptr<NodoBST<int, int>> r = nullptr;
    contador_rotaciones = 0;
    insertar_avl(r, 30, 30);
    insertar_avl(r, 10, 10);
    insertar_avl(r, 20, 20); // provoca rotacion LR (doble)
    assert(r->clave == 20 && "P2: raiz debe ser 20");
    assert(h(r) == 2 && "P2: altura debe ser 2");
    assert(contador_rotaciones == 2 && "P2: rotacion doble = 2 rotaciones simples");
    std::cout << "[P2 OK] caso_LR  (rotaciones simples = "
              << contador_rotaciones << ", tipo LR = 1 doble)" << std::endl;
    imprimir_arbol(r);
}

void test_P3_insercion_ordenada_grande()
{
    // Insertar 1..15 en orden - un BST degeneraria con h=15
    std::unique_ptr<NodoBST<int, int>> r = nullptr;
    for (int i = 1; i <= 15; i++)
        insertar_avl(r, i, i);
    assert(h(r) <= 4 && "P3: altura debe ser <= 4 para 15 nodos AVL");
    assert(buscar(r, 8) && "P3: nodo 8 debe existir");
    std::cout << "[P3 OK] insercion_ordenada_grande h=" << h(r) << std::endl;
    std::cout << "        inorden: ";
    imprimir_inorden(r);
    std::cout << std::endl;
}

// ---------------------------------------------------------------------
// Actividad 2A: casos P4-P6
// ---------------------------------------------------------------------
void test_P4_eliminar_hoja()
{
    std::unique_ptr<NodoBST<int, int>> r = nullptr;
    for (int x : {20, 10, 30})
        insertar_avl(r, x, x);
    eliminar_avl(r, 10); // hoja izquierda
    assert(!buscar(r, 10) && "P4: nodo 10 debe haberse eliminado");
    assert(h(r) <= 2 && "P4: arbol sigue balanceado");
    std::cout << "[P4 OK] eliminar_hoja" << std::endl;
}

void test_P5_eliminar_raiz_dos_hijos()
{
    std::unique_ptr<NodoBST<int, int>> r = nullptr;
    for (int x : {20, 10, 30, 25, 35})
        insertar_avl(r, x, x);
    int raiz_orig = r->clave;
    eliminar_avl(r, 20); // nodo raiz con 2 hijos
    assert(!buscar(r, 20) && "P5: nodo 20 eliminado");
    assert(h(r) <= 3 && "P5: arbol sigue balanceado");
    std::cout << "[P5 OK] eliminar_raiz_dos_hijos  (raiz " << raiz_orig
              << " -> " << r->clave << ")" << std::endl;
    imprimir_arbol(r);
}

void test_P6_eliminar_con_rebalanceo()
{
    // Insertar 1..7, eliminar 1 y verificar balanceo
    std::unique_ptr<NodoBST<int, int>> r = nullptr;
    for (int i = 1; i <= 7; i++)
        insertar_avl(r, i, i);
    int h_antes = h(r);
    eliminar_avl(r, 1);
    // Verificar que el arbol sigue siendo AVL
    assert(h(r) <= h_antes && "P6: altura no aumento tras eliminacion");
    std::cout << "[P6 OK] eliminar_con_rebalanceo  (h antes = " << h_antes
              << ", h despues = " << h(r) << ")" << std::endl;
}

// ---------------------------------------------------------------------
// Casos EXTRA (no estan en la guia): cubren LL y RL, y una prueba de estres
// ---------------------------------------------------------------------
void test_P7_caso_LL()
{
    std::unique_ptr<NodoBST<int, int>> r = nullptr;
    contador_rotaciones = 0;
    for (int x : {30, 20, 10})
        insertar_avl(r, x, x); // LL -> rotar_derecha
    assert(r->clave == 20 && h(r) == 2 && contador_rotaciones == 1);
    std::cout << "[P7 OK] caso_LL (extra)" << std::endl;
}

void test_P8_caso_RL()
{
    std::unique_ptr<NodoBST<int, int>> r = nullptr;
    contador_rotaciones = 0;
    for (int x : {10, 30, 20})
        insertar_avl(r, x, x); // RL -> doble rotacion
    assert(r->clave == 20 && h(r) == 2 && contador_rotaciones == 2);
    std::cout << "[P8 OK] caso_RL (extra)" << std::endl;
}

void test_P9_estres_aleatorio()
{
    // 2000 inserciones aleatorias y luego 1000 eliminaciones; el arbol debe seguir siendo AVL
    std::mt19937 gen(12345);
    std::vector<int> claves(2000);
    for (int i = 0; i < 2000; i++)
        claves[i] = i + 1;
    std::shuffle(claves.begin(), claves.end(), gen);

    std::unique_ptr<NodoBST<int, int>> r = nullptr;
    for (int c : claves)
        insertar_avl(r, c, c);
    assert(arbol_valido(r) && "P9: arbol invalido tras insertar");

    std::shuffle(claves.begin(), claves.end(), gen);
    for (int i = 0; i < 1000; i++)
    {
        eliminar_avl(r, claves[i]);
        assert(arbol_valido(r) && "P9: arbol invalido tras eliminar");
        assert(!buscar(r, claves[i]) && "P9: la clave no fue eliminada");
    }
    std::cout << "[P9 OK] estres_aleatorio (extra)  h final = " << h(r) << std::endl;
}

int main()
{
    test_P1_insercion_simple();
    test_P2_caso_LR();
    test_P3_insercion_ordenada_grande();
    test_P4_eliminar_hoja();
    test_P5_eliminar_raiz_dos_hijos();
    test_P6_eliminar_con_rebalanceo();
    test_P7_caso_LL();
    test_P8_caso_RL();
    test_P9_estres_aleatorio();
    std::cout << "=== Todos los casos P1-P6 (y extras P7-P9) pasaron ===" << std::endl;
    return 0;
}
