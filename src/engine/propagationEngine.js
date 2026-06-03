import { computeLogic, valueColors, mergeInformation, getSortedCandidates, getNotCandidate } from '../utils/logic';

export const runCalculation = (nodes, edges) => {
  // 1. Clonación inmutable manteniendo datos actuales
  let currentNodes = nodes.map(n => ({
    ...n,
    data: { ...n.data, allowedOptions: n.data.allowedOptions || ['N', 'T', 'F', 'B'] }
  }));

  console.log("%c[DATA COPY] Estado inicial de los nodos antes de propagar:", "color: #8e44ad; font-weight: bold;");
  console.log(JSON.parse(JSON.stringify(currentNodes)));

  const labelsWithInput = new Set(
    currentNodes
      .filter(n => n.type === 'variable' && edges.some(e => e.target === n.id))
      .map(n => n.data.label)
  );

  console.log("%c--- INICIO DE PROPAGACIÓN BIDIRECCIONAL MONOTÓNICA ---", "color: #3498db; font-weight: bold;");

  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 50;

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;

    // Estructura de peticiones para acumular los deseos hacia atrás en la presente iteración
    const inverseRequests = {};
    currentNodes.forEach(n => { inverseRequests[n.id] = new Set(); });

    // FASE 1: ONDA INVERSA (Backtracking si un nodo con cables de entrada posee un valor != 'N')
    currentNodes.forEach(node => {
      const incomingEdges = edges.filter(e => e.target === node.id);
      const currentValue = node.data.value || 'N';

      if (currentValue !== 'N' && incomingEdges.length > 0) {
        if (node.type === 'logic' && node.data.operator === 'NOT' && incomingEdges.length === 1) {
          const reqVal = getNotCandidate(currentValue);
          inverseRequests[incomingEdges[0].source].add(reqVal);
        } 
        else if ((node.type === 'logic' && incomingEdges.length === 2) || node.type === 'output') {
          // Si es un nodo de salida intermedio o final, evaluamos su compuerta o cable previo
          const sortedInputs = [...incomingEdges].sort((a, b) => {
            const nA = currentNodes.find(n => n.id === a.source);
            const nB = currentNodes.find(n => n.id === b.source);
            return (nA?.position.y || 0) - (nB?.position.y || 0);
          });

          if (node.type === 'logic') {
            const candidates = getSortedCandidates(node.data.operator, currentValue);
            if (candidates.length > 0) {
              const optimal = candidates[0]; // Selección automática de costo mínimo
              inverseRequests[sortedInputs[0].source].add(optimal.p);
              inverseRequests[sortedInputs[1].source].add(optimal.q);
            }
          } else {
            // Un nodo output simplemente transfiere la petición completa hacia atrás
            inverseRequests[sortedInputs[0].source].add(currentValue);
          }
        } 
        else if (node.type === 'variable' && incomingEdges.length === 1) {
          // Variable con cable de entrada (proceso inverso de asignación)
          inverseRequests[incomingEdges[0].source].add(currentValue);
        }
      }
    });

    // FASE 2: COMBINACIÓN Y PROPAGACIÓN DIRECTA (FORWARD)
    const nextStepNodes = currentNodes.map(node => {
      const inputEdges = edges.filter(e => e.target === node.id);
      let calculatedValue = node.data.value || 'N';

      // Si el nodo tiene entradas físicas, se calcula su valor hacia adelante
      if (inputEdges.length > 0) {
        const inputValues = inputEdges
          .sort((a, b) => {
            const nA = currentNodes.find(n => n.id === a.source);
            const nB = currentNodes.find(n => n.id === b.source);
            return (nA?.position.y || 0) - (nB?.position.y || 0);
          })
          .map(e => currentNodes.find(n => n.id === e.source)?.data?.value || 'N');

        calculatedValue = node.type === 'logic'
          ? computeLogic(node.data.operator, inputValues)
          : (inputValues[0] || 'N');
      }

      // INTEGRACIÓN MONOTÓNICA DE DESEOS INVERSOS:
      // Combinamos el valor calculado hacia adelante con las peticiones recolectadas hacia atrás
      const requests = inverseRequests[node.id];
      let finalValue = calculatedValue;

      if (requests && requests.size > 0) {
        const reqArray = Array.from(requests);
        let consolidatedRequest = reqArray[0];
        for (let i = 1; i < reqArray.length; i++) {
          consolidatedRequest = mergeInformation(consolidatedRequest, reqArray[i]);
        }
        finalValue = mergeInformation(calculatedValue, consolidatedRequest);
      }

      if (node.data.value !== finalValue) {
        changed = true;
      }

      // Almacenamos las opciones válidas para los selectores de la interfaz
      const optionsArray = requests && requests.size > 0 ? Array.from(requests) : ['N', 'T', 'F', 'B'];

      return {
        ...node,
        data: {
          ...node.data,
          value: finalValue,
          allowedOptions: optionsArray,
          hasIncomingConnection: inputEdges.length > 0
        }
      };
    });

    // FASE 3: SINCRONIZACIÓN GLOBAL DE ALIAS VARIABLES
    currentNodes = nextStepNodes.map(node => {
      if (node.type === 'variable' && labelsWithInput.has(node.data.label)) {
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

    // --- IMPRESIÓN SOLICITADA POR ITERACIÓN ---
    console.group(`%cIteración ${iterations}`, "color: #f1c40f; font-weight: bold; background: #2c3e50; padding: 2px 6px; borderRadius: 3px;");
    console.table(currentNodes.map(n => ({
      ID: n.id,
      Tipo: n.type,
      Etiqueta: n.data.label || n.data.operator || 'output',
      Valor: n.data.value,
      OpcionesDisponibles: n.data.allowedOptions.join(', ')
    })));
    console.log(changed ? "%cEl estado cambió. Siguiente ciclo..." : "%cCircuito Estable.", changed ? "color: #3498db;" : "color: #2ecc71; font-weight: bold;");
    console.groupEnd();
  }

  // --- TRAZA DE FINALIZACIÓN EN CONSOLA ---
  const outputNode = currentNodes.find(n => n.type === 'output');
  const outputVal = outputNode?.data?.value || 'N';
  const trace = Array.from(labelsWithInput).map(label => {
    const val = currentNodes.find(n => n.data.label === label)?.data.value;
    return `${label}(${val})`;
  }).join(", ");
  console.log(`%cIteraciones Totales: ${iterations} | ${trace} -- resultado (${outputVal})`, "color: #2ecc71; font-weight: bold;");

  // Actualización estética de aristas
  const updatedEdges = edges.map(edge => {
    const src = currentNodes.find(n => n.id === edge.source);
    const val = src?.data?.value || 'N';
    return {
      ...edge,
      animated: val !== 'N',
      style: { stroke: valueColors[val], strokeWidth: 3, strokeDasharray: '5,5' },
      data: { ...edge.data, color: valueColors[val], isAnimating: false }
    };
  });

  return { updatedNodes: currentNodes, updatedEdges };
};