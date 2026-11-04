# =====================================================================
# avl_python.py  -  AVL en Python 3.12
# SIS210 - Algoritmos y Estructuras de Datos - Semana 10 - UNAP 2026-II
#
# Contenido:
#   Parte 1: Nodo y funciones del AVL (altura, fb, rotaciones, balancear,
#            insertar_avl, buscar, inorden)
#   Parte 2: Actividad 2B  -> experimento BST vs AVL (tabla comparativa)
#   Parte 3: Actividad 3   -> sistema interactivo SIGA-UNAP-AVL
#
# Ejecutar:  python avl_python.py
# =====================================================================
import math
import random
import sys
from dataclasses import dataclass
from time import perf_counter


# =====================================================================
# PARTE 1: NODO Y FUNCIONES DEL AVL
# =====================================================================
class Nodo:
    def __init__(self, clave, valor=None):
        self.clave = clave        # clave de ordenamiento
        self.valor = valor        # dato asociado a la clave
        self.izq = self.der = None  # hijos izquierdo y derecho
        self.altura = 1           # un nodo nuevo es hoja: altura 1


def height(n):
    """Altura de un subarbol (arbol vacio = 0)."""
    return n.altura if n else 0


def fb(n):
    """Factor de balance = altura(der) - altura(izq)."""
    return height(n.der) - height(n.izq) if n else 0


def actualizar_altura(n):
    """Recalcula la altura de n a partir de sus hijos."""
    n.altura = 1 + max(height(n.izq), height(n.der))


def rotar_der(z):
    """Rotacion simple a la derecha (caso LL). Devuelve la nueva raiz."""
    y = z.izq            # y sera la nueva raiz
    z.izq = y.der        # el subarbol derecho de y pasa a ser hijo izquierdo de z
    y.der = z            # z pasa a ser hijo derecho de y
    actualizar_altura(z)  # primero z (quedo mas abajo)
    actualizar_altura(y)  # luego y (nueva raiz)
    return y


def rotar_izq(z):
    """Rotacion simple a la izquierda (caso RR). Devuelve la nueva raiz."""
    y = z.der            # y sera la nueva raiz
    z.der = y.izq        # el subarbol izquierdo de y pasa a ser hijo derecho de z
    y.izq = z            # z pasa a ser hijo izquierdo de y
    actualizar_altura(z)
    actualizar_altura(y)
    return y


def balancear(n):
    """Reequilibra el nodo n (casos LL, RR, LR, RL). Devuelve la nueva raiz del subarbol."""
    actualizar_altura(n)
    f = fb(n)
    if f > 1:                       # pesado a la derecha
        if fb(n.der) < 0:           # caso RL: primero rotar el hijo derecho
            n.der = rotar_der(n.der)
        return rotar_izq(n)         # caso RR (o 2do paso de RL)
    if f < -1:                      # pesado a la izquierda
        if fb(n.izq) > 0:           # caso LR: primero rotar el hijo izquierdo
            n.izq = rotar_izq(n.izq)
        return rotar_der(n)         # caso LL (o 2do paso de LR)
    return n                        # ya estaba balanceado


def insertar_avl(raiz, clave, valor=None):
    """Inserta (clave, valor) en el AVL y devuelve la nueva raiz."""
    if raiz is None:                # hueco encontrado: nodo nuevo
        return Nodo(clave, valor)
    if clave < raiz.clave:
        raiz.izq = insertar_avl(raiz.izq, clave, valor)
    elif clave > raiz.clave:
        raiz.der = insertar_avl(raiz.der, clave, valor)
    else:                           # clave repetida: se actualiza el valor
        raiz.valor = valor
        return raiz
    return balancear(raiz)          # al volver, se reequilibra


def buscar(raiz, clave):
    """Busca una clave. Devuelve el nodo o None (equivalente a buscar de avl.h)."""
    while raiz is not None:
        if clave == raiz.clave:
            return raiz
        raiz = raiz.izq if clave < raiz.clave else raiz.der
    return None


def inorden(raiz, resultado=None):
    """Recorrido inorden: devuelve la lista de nodos ordenados por clave."""
    if resultado is None:
        resultado = []
    if raiz is not None:
        inorden(raiz.izq, resultado)
        resultado.append(raiz)
        inorden(raiz.der, resultado)
    return resultado


# =====================================================================
# PARTE 2: ACTIVIDAD 2B - EXPERIMENTO BST vs AVL
# =====================================================================
def insertar_bst(raiz, clave):
    """Insercion en un BST simple, sin balanceo."""
    if raiz is None:
        return Nodo(clave)
    if clave < raiz.clave:
        raiz.izq = insertar_bst(raiz.izq, clave)
    elif clave > raiz.clave:
        raiz.der = insertar_bst(raiz.der, clave)
    return raiz


def altura_arbol(n):
    """Altura real de un arbol recorriendolo (no usa el campo altura)."""
    if n is None:
        return 0
    return 1 + max(altura_arbol(n.izq), altura_arbol(n.der))


def experimento(n, orden='random'):
    """Inserta n claves en un BST y en un AVL. Devuelve (h_bst, h_avl, limite_teorico)."""
    claves = list(range(1, n + 1))
    if orden == 'random':
        random.shuffle(claves)

    # BST simple
    sys.setrecursionlimit(n + 100)   # el BST ordenado llega a profundidad n
    raiz_bst = None
    for c in claves:
        raiz_bst = insertar_bst(raiz_bst, c)
    h_bst = altura_arbol(raiz_bst)

    # AVL
    raiz_avl = None
    for c in claves:
        raiz_avl = insertar_avl(raiz_avl, c)
    h_avl = raiz_avl.altura if raiz_avl else 0

    limite_teorico = int(1.44 * math.log2(n + 1))
    return h_bst, h_avl, limite_teorico


def ejecutar_experimento():
    """Imprime la tabla comparativa de la Actividad 2B."""
    random.seed(2026)   # semilla fija para que los resultados sean reproducibles
    print(f"{'n':>8} | {'BST (ord)':>10} | {'AVL (ord)':>10} | {'Teorico':>10} | "
          f"{'BST (rnd)':>10} | {'AVL (rnd)':>10}")
    print('-' * 68)
    for n in [100, 500, 1000, 5000, 10000]:
        h_bst_o, h_avl_o, teo = experimento(n, 'ordered')
        h_bst_r, h_avl_r, _ = experimento(n, 'random')
        print(f"{n:>8} | {h_bst_o:>10} | {h_avl_o:>10} | {teo:>10} | "
              f"{h_bst_r:>10} | {h_avl_r:>10}")


# =====================================================================
# PARTE 3: ACTIVIDAD 3 - SIGA-UNAP-AVL
# =====================================================================
@dataclass
class EstudianteUNAP:
    codigo: str
    nombre: str
    escuela: str
    promedio: float


class SIGA_AVL:
    def __init__(self):
        self.raiz = None   # raiz del AVL
        self.total = 0     # cantidad de estudiantes matriculados

    def matricular(self, est: EstudianteUNAP):
        t0 = perf_counter()
        existia = buscar(self.raiz, est.codigo) is not None   # evita contar duplicados
        self.raiz = insertar_avl(self.raiz, est.codigo, est)  # clave = codigo
        if not existia:
            self.total += 1
        t1 = perf_counter()
        if existia:
            print(f'  Codigo {est.codigo} ya existia: datos actualizados ({(t1 - t0) * 1e6:.2f} us)')
        else:
            print(f'  Matriculado {est.nombre} en {(t1 - t0) * 1e6:.2f} us')

    def buscar_estudiante(self, codigo: str):
        t0 = perf_counter()
        nodo = buscar(self.raiz, codigo)
        t1 = perf_counter()
        if nodo:
            print(f'  Encontrado: {nodo.valor}  ({(t1 - t0) * 1e6:.2f} us)')
        else:
            print(f'  Codigo {codigo} no encontrado  ({(t1 - t0) * 1e6:.2f} us)')

    def listar_ordenado(self):
        # Recorrido inorden del AVL => lista ordenada por codigo
        nodos = inorden(self.raiz)
        if not nodos:
            print('  (no hay estudiantes matriculados)')
            return
        print(f"  {'Codigo':<12} {'Nombre':<16} {'Escuela':<10} {'Promedio':>8}")
        print('  ' + '-' * 50)
        for nodo in nodos:
            e = nodo.valor
            print(f'  {e.codigo:<12} {e.nombre:<16} {e.escuela:<10} {e.promedio:>8.2f}')

    def estadisticas(self):
        h = self.raiz.altura if self.raiz else 0
        teo = int(1.44 * math.log2(self.total + 1)) if self.total > 0 else 0
        print(f'  Total estudiantes: {self.total}')
        print(f'  Altura AVL actual: {h}')
        print(f'  Altura teorica max: {teo}')
        print(f"  Eficiencia: {'OPTIMO' if h <= teo else 'SUBOPTIMO'}")


def menu():
    siga = SIGA_AVL()
    # Cargar 10 estudiantes de muestra
    muestra = [
        EstudianteUNAP('2026100001', 'Ana Quispe', 'Sistemas', 15.5),
        EstudianteUNAP('2026100002', 'Luis Mamani', 'Sistemas', 14.0),
        EstudianteUNAP('2026100003', 'Rosa Condori', 'IA&CD', 17.2),
        EstudianteUNAP('2026100004', 'Ivan Huanca', 'Sistemas', 13.8),
        EstudianteUNAP('2026100005', 'Maria Apaza', 'IA&CD', 16.9),
        EstudianteUNAP('2026100006', 'Carlos Tito', 'Sistemas', 12.1),
        EstudianteUNAP('2026100007', 'Lucia Ramos', 'IA&CD', 18.0),
        EstudianteUNAP('2026100008', 'Pedro Vargas', 'Sistemas', 15.0),
        EstudianteUNAP('2026100009', 'Sofia Luna', 'IA&CD', 16.4),
        EstudianteUNAP('2026100010', 'Juan Puma', 'Sistemas', 14.7),
    ]
    print('Cargando 10 estudiantes...')
    for e in muestra:
        siga.matricular(e)

    while True:
        print('\n=== SIGA-UNAP-AVL ===')
        print('1. Matricular nuevo estudiante')
        print('2. Buscar por codigo')
        print('3. Listar todos (inorden)')
        print('4. Estadisticas del arbol')
        print('5. Salir')
        try:
            op = input('Opcion: ').strip()
        except EOFError:        # si se acaba la entrada, salir sin error
            break
        if op == '1':
            cod = input('  Codigo: ').strip()
            nom = input('  Nombre: ').strip()
            esc = input('  Escuela: ').strip()
            try:
                prom = float(input('  Promedio: '))
            except ValueError:
                print('  Promedio invalido: debe ser un numero')
                continue
            siga.matricular(EstudianteUNAP(cod, nom, esc, prom))
        elif op == '2':
            siga.buscar_estudiante(input('  Codigo: ').strip())
        elif op == '3':
            siga.listar_ordenado()
        elif op == '4':
            siga.estadisticas()
        elif op == '5':
            break
        else:
            print('  Opcion no valida')


if __name__ == '__main__':
    print('===== ACTIVIDAD 2B: BST vs AVL =====')
    ejecutar_experimento()
    print('\n===== ACTIVIDAD 3: SIGA-UNAP-AVL =====')
    menu()
