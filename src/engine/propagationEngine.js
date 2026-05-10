import { computeLogic, valueColors, mergeInformation } from '../utils/logic';

export const runCalculation = (nodes, edges) => {
  // 1. FASE DE RESET: Limpiamos la jerarquía antes de empezar
  let currentNodes = nodes.map(n => {
    // Si NO es una variable, reseteamos su valor a 'N'
    if (n.type !== 'variable') {
      return {
        ...n,
        data: { ...n.data, value: 'N' }
      };
    }
    // Si es una variable, conservamos su valor actual (T, F, B o N)
    return {
      ...n,
      data: { ...n.data }
    };
  });

  // === PRINT DE AUDITORÍA ===
  console.log("%c[DATA COPY] Estado inicial de los nodos antes de propagar:", "color: #8e44ad; font-weight: bold;");
  // Usamos JSON.parse/stringify para "congelar" los datos en este instante exacto
  console.log(JSON.parse(JSON.stringify(currentNodes)));
  // Opcional: una tabla para ver los valores rápidamente
  console.table(currentNodes.map(n => ({ id: n.id, type: n.type, val: n.data.value, label: n.data.label })));
  // ==========================

  // Identificamos qué etiquetas de variables tienen una entrada física (cable)
  const labelsWithInput = new Set(
    currentNodes
      .filter(n => n.type === 'variable' && edges.some(e => e.target === n.id))
      .map(n => n.data.label)
  );

  console.log("%c--- INICIO DE PROPAGACIÓN MONOTÓNICA ---", "color: #3498db; font-weight: bold;");

  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 50;

  // Bucle de estabilización
  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;

    // A. Propagación Física (Cálculo a través de aristas)
    const nextStepNodes = currentNodes.map(node => {
      const inputEdges = edges.filter(e => e.target === node.id);

      // Si el nodo no tiene entradas, mantiene su valor actual (ej. variables de entrada manual)
      if (inputEdges.length === 0) return node;

      // Obtenemos valores de entrada ordenados por posición Y (arriba -> abajo)
      const inputValues = inputEdges
        .sort((a, b) => {
          const nA = currentNodes.find(n => n.id === a.source);
          const nB = currentNodes.find(n => n.id === b.source);
          return (nA?.position.y || 0) - (nB?.position.y || 0);
        })
        .map(e => currentNodes.find(n => n.id === e.source)?.data?.value || 'N');

      // Calculamos el valor crudo que arroja la lógica o el cable
      let rawNewValue = node.type === 'logic'
        ? computeLogic(node.data.operator, inputValues)
        : (inputValues[0] || 'N');

      // APLICACIÓN DE JERARQUÍA:
      // Combinamos el valor que ya tenía el nodo con el nuevo valor calculado
      const finalValue = mergeInformation(node.data.value, rawNewValue);

      // Si el valor cambió tras la fusión, seguimos iterando
      if (node.data.value !== finalValue) {
        changed = true;
      }

      return {
        ...node,
        data: {
          ...node.data,
          value: finalValue,
          hasIncomingConnection: true
        }
      };
    });

    // B. Sincronización Global (Variables con el mismo nombre)
    currentNodes = nextStepNodes.map(node => {
      if (node.type === 'variable' && labelsWithInput.has(node.data.label)) {
        // Buscamos el "Master" (el nodo que recibe el cable físicamente)
        const masterNode = nextStepNodes.find(n =>
          n.type === 'variable' &&
          n.data.label === node.data.label &&
          edges.some(e => e.target === n.id)
        );

        if (masterNode && node.data.value !== masterNode.data.value) {
          changed = true;
          return { ...node, data: { ...node.data, value: masterNode.data.value } };
        }
      }
      return node;
    });
    // --- BLOQUE DE IMPRESIÓN POR ITERACIÓN ---
    console.group(`%cIteración ${iterations}`, "color: #f1c40f; font-weight: bold; background: #2c3e50; padding: 2px 6px; borderRadius: 3px;");
    
    const iterationTable = currentNodes.map(n => ({
      ID: n.id,
      Tipo: n.type,
      Etiqueta: n.data.label || n.data.operator || 'output',
      Valor: n.data.value
    }));

    console.table(iterationTable);
    
    // Log adicional para ver si el bucle continuará
    if (changed) {
      console.log("%cEl estado ha cambiado. Iniciando siguiente iteración...", "color: #3498db; font-style: italic;");
    } else {
      console.log("%cEstado estable alcanzado.", "color: #2ecc71; font-weight: bold;");
    }
    
    console.groupEnd();
    // ------------------------------------------
  }

  

  // --- TRAZA DE FINALIZACIÓN ---
  const outputNode = currentNodes.find(n => n.type === 'output');
  const outputVal = outputNode?.data?.value || 'N';

  const trace = Array.from(labelsWithInput).map(label => {
    const val = currentNodes.find(n => n.data.label === label)?.data.value;
    return `${label}(${val})`;
  }).join(", ");

  console.log(`%cIteraciones: ${iterations} | ${trace} -- resultado (${outputVal})`, "color: #2ecc71; font-weight: bold;");

  // Actualizamos las aristas para reflejar los colores finales y limpiar estados de animación
  const updatedEdges = edges.map(edge => {
    const src = currentNodes.find(n => n.id === edge.source);
    const val = src?.data?.value || 'N';
    return {
      ...edge,
      animated: val !== 'N',
      style: {
        stroke: valueColors[val],
        strokeWidth: 3,
        strokeDasharray: '5,5'
      },
      data: {
        ...edge.data,
        color: valueColors[val],
        isAnimating: false // Se apagan las bolitas individuales al terminar el cálculo global
      }
    };
  });

  return { updatedNodes: currentNodes, updatedEdges };
};