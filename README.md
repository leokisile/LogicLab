# Logic Lab: Simulador de Lógica Proposicional

**Logic Lab** es una herramienta educativa e interactiva diseñada para construir, visualizar y evaluar expresiones de lógica proposicional mediante diagramas de flujo. Permite a los usuarios entender cómo se estructuran las fórmulas complejas y cómo se propagan los valores de verdad a través de un circuito.

![Versión del Proyecto](https://img.shields.io/badge/version-1.0.0-blue)
![Licencia](https://img.shields.io/badge/license-MIT-green)

---

## Características Principales

-   **Construcción Visual:** Utiliza `React Flow` para una experiencia fluida de arrastrar y soltar.
-   **Nodos de Variable Inteligentes:** Configura valores manuales (True/False) que actúan como la raíz del sistema.
-   **Agrupación de Paréntesis Progresiva:** Algoritmo recursivo que genera fórmulas siguiendo el orden de pares: `((p ∨ q) ∧ s)`.
-   **Cálculo de Propagación:** Motor de cálculo con 10 pasadas de seguridad para garantizar que el valor de verdad llegue hasta el nodo final.
-   **Depuración en Consola:** Logs detallados que muestran cómo se "rastrea" el árbol lógico de derecha a izquierda.
-   **Feedback Visual:** Cables animados que cambian de color según el flujo eléctrico (Verde: T, Rojo: F, Gris: N).

---

## Especificaciones Técnicas

### El Algoritmo de Conversión (Rastreo Inverso)
A diferencia de un compilador estándar, este proyecto utiliza un **rastreo inverso desde el nodo de salida**. 

1.  **Identificación:** Busca el nodo conectado al "Resultado".
2.  **Recursividad:** Si el nodo tiene entradas, viaja hacia atrás a los nodos de origen.
3.  **Ordenamiento Espacial:** Si una compuerta tiene dos entradas, el sistema compara su posición en el eje X. El nodo más a la izquierda se procesa primero.
4.  **Agrupación:** Cada operación binaria se envuelve en un nuevo nivel de paréntesis, asegurando la estructura: `(Expresión_Actual) OPERADOR (Variable_Siguiente)`.

### Requisitos de los Nodos
- **Variables:** Son hojas puras (puntos de origen). No aceptan conexiones de entrada para mantener la integridad de la lógica proposicional.
- **Operadores:** Soportan AND (∧), OR (∨), NOT (¬), IMPLIES (→) y EQUIV (↔).

---

## Instalación y Ejecución

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

### 1. Requisitos Previos
Necesitas tener instalado [Node.js](https://nodejs.org/) (recomendado v16 o superior).

### 2. Clonar y Configurar
```bash
# Clonar el repositorio
git clone [https://github.com/TU_USUARIO/logic-lab.git](https://github.com/TU_USUARIO/logic-lab.git)

# Entrar a la carpeta
cd logic-lab

# Instalar las dependencias
npm install

# Lanzar la aplicación
npm run dev
```
### 3. Guía de uso
1. Crea tus variables: Haz clic en + Variable y dales un nombre (ej. p).

2. Define valores: Selecciona T o F en el menú desplegable de cada variable.

3. Añade compuertas: Coloca operadores y conéctalos. Recuerda colocar el antecedente a la izquierda del consecuente para que la fórmula se lea correctamente.

4. Finaliza el circuito: Conecta la última compuerta al botón morado de + Resultado.

5. Calcula: Presiona el botón verde CALCULAR. La fórmula aparecerá en el panel lateral y los cables se iluminarán.