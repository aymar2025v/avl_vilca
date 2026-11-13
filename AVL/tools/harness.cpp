// Arnés para compare_cpp.mjs: ejecuta operaciones sobre el avl.h REAL y vuelca el árbol tras cada una.
//   entrada:  "i 5" (insertar) · "d 5" (eliminar), una por línea
//   salida:   preorden "clave:altura ..." y "| rot=N" (contador_rotaciones)
#include <iostream>
#include <sstream>
#include <string>
#include "../avl.h"
using namespace std;

template <typename K, typename V>
void pre(const unique_ptr<NodoBST<K, V>> &n, ostream &o)
{
    if (!n) return;
    o << n->clave << ':' << n->altura << ' ';
    pre(n->izq, o);
    pre(n->der, o);
}

int main()
{
    unique_ptr<NodoBST<int, int>> r;
    string line;
    while (getline(cin, line))
    {
        istringstream s(line);
        char op; int k;
        s >> op >> k;
        if (op == 'i') insertar_avl(r, k, k);
        else           eliminar_avl(r, k);
        pre(r, cout);
        cout << "| rot=" << contador_rotaciones << "\n";
    }
}
