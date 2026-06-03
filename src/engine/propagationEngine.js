import { computeLogic, valueColors, mergeInformation, getSortedCandidates, getNotCandidate } from '../utils/logic';

export const runCalculation = (nodes, edges) => {
  // 1. Clonación inmutable manteniendo datos actuales
  let currentNodes = nodes.map(n => ({
    ...n,
    data: { ...n.data, allowedOptions: n.data.allowedOptions || ['N', 'T', 'F', 'B'] }
  }));

  console.log("%c[DATA COPY] Estado inicial de los nodos antes de propagar:", "color: #8e44ad; font-weight: bold;");
  console.log(JSON.parse(JSON.stringify(currentNodes)));

  // Guardamos un registro estático de cuáles nodos tenían un valor inicial != 'N' en la interfaz
  const initialStimuli = nodes
    .filter(n => (n.type === 'logic' || n.type === 'output') && n.data.value && n.data.value !== 'N')
    .map(n => ({ id: n.id, type: n.type, label: n.data.label || n.data.operator || 'output', initialValue: n.data.value }));

  const labelsWithInput = new Set(
    currentNodes
      .filter(n => n.type === 'variable' && edges.some(e => e.target === n.id))
      .map(n => n.data.label)
  );

  console.log("%c--- INICIO DE PROPAGACIÓN BIDIRECCIONAL MONOTÓNICA ---", "color: #3498db; font-weight: bold;");

  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 50;

  // Registro dinámico en caliente para auditar las compuertas arrastradas en la onda inversa
  const evaluatedCompuertas = new Set();

  // Mapa de persistencia para evitar que las opciones válidas de la UI se limpien al estabilizar el bucle
  const finalSelectorOptions = {};
  currentNodes.forEach(n => {
    finalSelectorOptions[n.id] = ['N', 'T', 'F', 'B'];
  });

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
          
          // NOT solo admite una opción para su entrada directa
          finalSelectorOptions[incomingEdges[0].source] = [reqVal];
        }
        else if ((node.type === 'logic' && incomingEdges.length === 2) || node.type === 'output') {
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

              // Almacenar todas las opciones válidas de los candidatos para la UI
              finalSelectorOptions[sortedInputs[0].source] = [...new Set(candidates.map(c => c.p))];
              finalSelectorOptions[sortedInputs[1].source] = [...new Set(candidates.map(c => c.q))];

              // Registro en caliente para el reporte de antecedentes
              evaluatedCompuertas.add(node.id);
            }
          } else {
            // Un nodo output transfiere la petición completa hacia atrás
            inverseRequests[sortedInputs[0].source].add(currentValue);
            finalSelectorOptions[sortedInputs[0].source] = [currentValue];
          }
        }
        else if (node.type === 'variable' && incomingEdges.length === 1) {
          // Variable con cable de entrada (proceso inverso de asignación)
          inverseRequests[incomingEdges[0].source].add(currentValue);
          finalSelectorOptions[incomingEdges[0].source] = [currentValue];
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

      // INTEGRACIÓN MONOTÓNICA DE DESEOS INVERSOS
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

      return {
        ...node,
        data: {
          ...node.data,
          value: finalValue,
          allowedOptions: finalSelectorOptions[node.id], // Inyección persistente corregida
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

  // === REPORTE DE ANÁLISIS DE PREIMÁGENES MEJORADO EN CONJUNTOS ===
  if (initialStimuli.length > 0 || evaluatedCompuertas.size > 0) {
    console.group("%c[ANÁLISIS DE ANTECEDENTES INVERSOS INTERACTIVOS]", "color: #e67e22; font-weight: bold; background: #fdf2e9; padding: 4px; border: 1px solid #e67e22;");
    
    // 1. Desglosar estímulos iniciales de la UI
    initialStimuli.forEach(stim => {
      console.log(`%c[Estímulo UI] Nodo: [${stim.label}] (ID: ${stim.id}) | Valor inicial forzado: ${stim.initialValue}`, "font-weight: bold; color: #d35400;");
      if (stim.type === 'output') {
        console.log(`  -> Entrada inmediata admitida: [${stim.initialValue}] (Transferencia directa de cable)`);
      }
    });

    // 2. Desglosar todas las compuertas binarias afectadas con sus conjuntos ordenados (valor 1, valor 2)
    evaluatedCompuertas.forEach(compuertaId => {
      const compuertaNodo = currentNodes.find(n => n.id === compuertaId);
      if (compuertaNodo) {
        const finalVal = compuertaNodo.data.value; 
        const candidates = getSortedCandidates(compuertaNodo.data.operator, finalVal);

        console.log(`%c[Inferencia en Cascada] Compuerta: [${compuertaNodo.data.operator}] (ID: ${compuertaId}) | Resolviendo para salida: ${finalVal}`, "font-weight: bold; color: #2980b9;");
        console.log(`  -> Combinaciones posibles en conjuntos (valor 1, valor 2):`);
        
        candidates.forEach((c, idx) => {
          console.log(`     ${idx + 1}. Conjunto: (${c.p}, ${c.q}) | Costo total: ${c.cost} ${idx === 0 ? ' <- [Seleccionada por Heurística]' : ''}`);
        });
      }
    });

    console.groupEnd();
  }

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