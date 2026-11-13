// =====================================================================
// avl.h  -  Arbol AVL en C++17
// SIS210 - Algoritmos y Estructuras de Datos - Semana 10 - UNAP 2026-II
// Compilar el programa de prueba:  g++ -std=c++17 avl_main.cpp -o avl_main
// =====================================================================
#pragma once

#include <memory>    // std::unique_ptr, std::make_unique
#include <algorithm> // std::max
#include <string>    // std::string
#include <utility>   // std::move
#include <iostream>  // std::cout (solo para las funciones de impresion)

// ---------------------------------------------------------------------
// Nodo del arbol (misma estructura del BST de S09, mas el campo altura)
// ---------------------------------------------------------------------
template <typename K, typename V = K>
struct NodoBST
{
    K clave;                           // clave de ordenamiento
    V valor;                           // dato asociado a la clave
    std::unique_ptr<NodoBST> izq, der; // hijos (el nodo es dueño de sus hijos)
    int altura;                        // altura del subarbol cuya raiz es este nodo

    explicit NodoBST(K k, V v = V{})
        : clave(std::move(k)), valor(std::move(v)),
          izq(nullptr), der(nullptr), altura(1) {} // un nodo nuevo es hoja: altura 1
};

// ---------------------------------------------------------------------
// Contador global de rotaciones simples (extra, para responder P1-A y P1-B).
// "inline" en C++17 permite definir la variable en un header sin errores.
// ---------------------------------------------------------------------
inline int contador_rotaciones = 0;

// ---------------------------------------------------------------------
// Funciones ya entregadas por la guia: altura y factor de balance
// ---------------------------------------------------------------------

// Altura de un subarbol. Un arbol vacio tiene altura 0.
template <typename K, typename V>
int altura(const std::unique_ptr<NodoBST<K, V>> &n)
{
    return n ? n->altura : 0;
}

// Factor de balance = altura(derecha) - altura(izquierda).
// AVL valido  <=>  fb en {-1, 0, 1} en todos los nodos.
template <typename K, typename V>
int factor_balance(const std::unique_ptr<NodoBST<K, V>> &n)
{
    return n ? altura(n->der) - altura(n->izq) : 0;
}

// Recalcula la altura del nodo a partir de la altura de sus hijos.
template <typename K, typename V>
void actualizar_altura(std::unique_ptr<NodoBST<K, V>> &n)
{
    if (n)
        n->altura = 1 + std::max(altura(n->izq), altura(n->der));
}

// ---------------------------------------------------------------------
// TODO 1: rotar_derecha(z)   (corrige el caso LL)
/*
         z                 y
        / \              /   \
       y   T4    ==>    x     z
      / \              / \   / \
     x   T3           T1 T2 T3 T4
*/
// ---------------------------------------------------------------------
template <typename K, typename V>
void rotar_derecha(std::unique_ptr<NodoBST<K, V>> &z)
{
    auto y = std::move(z->izq); // y = hijo izquierdo de z (sera la nueva raiz)
    z->izq = std::move(y->der); // el subarbol T3 de y pasa a ser hijo izquierdo de z
    actualizar_altura(z);       // z ahora esta mas abajo: primero se actualiza z
    y->der = std::move(z);      // z pasa a ser hijo derecho de y
    z = std::move(y);           // y toma el lugar de z en el arbol
    actualizar_altura(z);       // luego se actualiza y (nueva raiz del subarbol)
    ++contador_rotaciones;      // contamos la rotacion
}

// ---------------------------------------------------------------------
// TODO 2: rotar_izquierda(z)   (corrige el caso RR; es el espejo de la anterior)
/*
       z                     y
      / \                  /   \
     T1  y      ==>       z     x
        / \              / \   / \
       T2  x            T1 T2 T3 T4
          / \
         T3 T4
*/
// ---------------------------------------------------------------------
template <typename K, typename V>
void rotar_izquierda(std::unique_ptr<NodoBST<K, V>> &z)
{
    auto y = std::move(z->der); // y = hijo derecho de z (sera la nueva raiz)
    z->der = std::move(y->izq); // el subarbol T2 de y pasa a ser hijo derecho de z
    actualizar_altura(z);       // primero se actualiza z (quedo mas abajo)
    y->izq = std::move(z);      // z pasa a ser hijo izquierdo de y
    z = std::move(y);           // y toma el lugar de z
    actualizar_altura(z);       // se actualiza la nueva raiz del subarbol
    ++contador_rotaciones;      // contamos la rotacion
}

// ---------------------------------------------------------------------
// TODO 3: balancear(n)   (4 casos: LL, RR, LR, RL)
//   fb > 1  -> pesado a la derecha:
//        hijo der con fb >= 0 -> caso RR -> rotar_izquierda(n)
//        hijo der con fb <  0 -> caso RL -> rotar_derecha(n->der) y rotar_izquierda(n)
//   fb < -1 -> pesado a la izquierda:
//        hijo izq con fb <= 0 -> caso LL -> rotar_derecha(n)
//        hijo izq con fb >  0 -> caso LR -> rotar_izquierda(n->izq) y rotar_derecha(n)
//   (los ">= 0" y "<= 0" son necesarios en la ELIMINACION, donde el hijo puede tener fb = 0)
// ---------------------------------------------------------------------
template <typename K, typename V>
void balancear(std::unique_ptr<NodoBST<K, V>> &n)
{
    actualizar_altura(n);       // 1) altura correcta del nodo actual
    int fb = factor_balance(n); // 2) factor de balance actual

    if (fb > 1)
    {                                   // desbalance hacia la derecha
        if (factor_balance(n->der) < 0) //   caso RL: primero rotar el hijo derecho
            rotar_derecha(n->der);
        rotar_izquierda(n); //   caso RR (o 2do paso de RL)
    }
    else if (fb < -1)
    {                                   // desbalance hacia la izquierda
        if (factor_balance(n->izq) > 0) //   caso LR: primero rotar el hijo izquierdo
            rotar_izquierda(n->izq);
        rotar_derecha(n); //   caso LL (o 2do paso de LR)
    }
}

// ---------------------------------------------------------------------
// TODO 4: insertar_avl(raiz, clave, valor)
// Igual que insertar en un BST, pero al volver de la recursion se llama a balancear.
// ---------------------------------------------------------------------
template <typename K, typename V>
void insertar_avl(std::unique_ptr<NodoBST<K, V>> &raiz,
                  K clave, V valor = V{})
{
    if (!raiz)
    { // caso base: hueco encontrado
        raiz = std::make_unique<NodoBST<K, V>>(std::move(clave), std::move(valor));
        return; // un nodo hoja nunca esta desbalanceado
    }
    if (clave < raiz->clave) // ir al subarbol izquierdo
        insertar_avl(raiz->izq, std::move(clave), std::move(valor));
    else if (clave > raiz->clave) // ir al subarbol derecho
        insertar_avl(raiz->der, std::move(clave), std::move(valor));
    else
    { // clave repetida: solo se actualiza el valor
        raiz->valor = std::move(valor);
        return; // la forma del arbol no cambia
    }
    balancear(raiz); // al regresar, se reequilibra el camino
}

// ---------------------------------------------------------------------
// YA IMPLEMENTADA - no modificar
// ---------------------------------------------------------------------
template <typename K, typename V>
NodoBST<K, V> *buscar(const std::unique_ptr<NodoBST<K, V>> &raiz,
                      const K &clave)
{
    if (!raiz)
        return nullptr;
    if (clave == raiz->clave)
        return raiz.get();
    if (clave < raiz->clave)
        return buscar(raiz->izq, clave);
    return buscar(raiz->der, clave);
}

// ---------------------------------------------------------------------
// Actividad 2A: eliminacion AVL
// ---------------------------------------------------------------------

// Nodo con la clave minima de un subarbol (el mas a la izquierda).
template <typename K, typename V>
NodoBST<K, V> *minimo(const std::unique_ptr<NodoBST<K, V>> &n)
{
    return n->izq ? minimo(n->izq) : n.get();
}

template <typename K, typename V>
void eliminar_avl(std::unique_ptr<NodoBST<K, V>> &raiz,
                  const K &clave)
{
    if (!raiz)
        return; // clave inexistente: no hay nada que hacer

    if (clave < raiz->clave)
        eliminar_avl(raiz->izq, clave); // buscar en la izquierda
    else if (clave > raiz->clave)
        eliminar_avl(raiz->der, clave); // buscar en la derecha
    else
    { // se encontro el nodo a eliminar
        if (!raiz->izq && !raiz->der)
        {
            // Caso 1: sin hijos (hoja) -> simplemente se elimina
            raiz = nullptr;
        }
        else if (!raiz->izq)
        {
            // Caso 2a: solo hijo derecho -> el hijo ocupa el lugar del nodo
            auto hijo = std::move(raiz->der);
            raiz = std::move(hijo);
        }
        else if (!raiz->der)
        {
            // Caso 2b: solo hijo izquierdo -> el hijo ocupa el lugar del nodo
            auto hijo = std::move(raiz->izq);
            raiz = std::move(hijo);
        }
        else
        {
            // Caso 3: dos hijos -> usar el sucesor inorden (minimo del subarbol derecho)
            NodoBST<K, V> *suc = minimo(raiz->der);
            K clave_suc = suc->clave;           // COPIA de la clave antes de borrar el nodo
            raiz->clave = clave_suc;            // copiar clave del sucesor a este nodo
            raiz->valor = suc->valor;           // copiar valor del sucesor
            eliminar_avl(raiz->der, clave_suc); // eliminar el sucesor (tiene a lo mas 1 hijo)
        }
    }
    if (raiz)
        balancear(raiz); // reequilibrar al regresar
}

// ---------------------------------------------------------------------
// Funciones extra para mostrar el arbol (utiles para las capturas)
// ---------------------------------------------------------------------

// Recorrido inorden: imprime las claves en orden ascendente.
template <typename K, typename V>
void imprimir_inorden(const std::unique_ptr<NodoBST<K, V>> &n)
{
    if (!n)
        return;
    imprimir_inorden(n->izq);
    std::cout << n->clave << " ";
    imprimir_inorden(n->der);
}

// Dibuja el arbol "de lado": la raiz a la izquierda, el hijo derecho arriba.
template <typename K, typename V>
void imprimir_arbol(const std::unique_ptr<NodoBST<K, V>> &n, int nivel = 0)
{
    if (!n)
        return;
    imprimir_arbol(n->der, nivel + 1);
    std::cout << std::string(nivel * 6, ' ')
              << n->clave << " (h=" << n->altura
              << ", fb=" << factor_balance(n) << ")\n";
    imprimir_arbol(n->izq, nivel + 1);
}
