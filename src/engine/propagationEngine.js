import {
  computeLogic,
  valueColors,
  mergeInformation,
  getHeuristicLowestCostPair,
  INV_V,
  futureSets
} from '../utils/logic';

export const runCalculation = (nodes, edges) => {
  // 1. Inicializar estados locales conservando los valores actuales de la UI
  let currentNodes = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      value: n.data.value || 'N',
      allowedOptions: [...INV_V]
    }
  }));

  const userInitialValues = new Map(nodes.map(n => [n.id, n.data.value || 'N']));
  const finalSelectorOptions = {};
  currentNodes.forEach(n => { finalSelectorOptions[n.id] = [...INV_V]; });
  const evaluatedCompuertas = new Set();

  // =========================================================================
  // MOTOR UNIFICADO BASADO EN EL CONJUNTO DE PAREJAS DE MÍNIMO COSTO
  // =========================================================================
  currentNodes.forEach(node => {
    if (node.type === 'logic') {
      const incomingEdges = edges.filter(e => e.target === node.id);
      if (incomingEdges.length === 0) return;

      // Ordenar entradas por posición en el eje Y
      const sortedInputs = [...incomingEdges].sort((a, b) => {
        const nA = currentNodes.find(n => n.id === a.source);
        const nB = currentNodes.find(n => n.id === b.source);
        return (nA?.position.y || 0) - (nB?.position.y || 0);
      });

      const isUnary = node.data.operator === 'NOT';
      evaluatedCompuertas.add(node.id);

      const idPadreP = sortedInputs[0].source;
      const idPadreQ = !isUnary && sortedInputs[1] ? sortedInputs[1].source : null;

      const originalP = userInitialValues.get(idPadreP);
      const originalQ = idPadreQ ? userInitialValues.get(idPadreQ) : 'N';

      // --- NUEVA VALIDACIÓN: Si el nodo padre ya tiene un valor, 
      // no permitas que la heurística lo cambie por otra cosa ---
      const forceP = originalP !== 'N' ? originalP : null;
      const forceQ = originalQ !== 'N' ? originalQ : null;

      // Obtener la restricción de salida Z
      let restrictZ = userInitialValues.get(node.id);
      const outgoingEdge = edges.find(e => e.source === node.id);
      if (outgoingEdge) {
        const targetNodeValue = userInitialValues.get(outgoingEdge.target);
        if (targetNodeValue !== 'N') restrictZ = targetNodeValue;
      }

      // 1. CONSTRUIR CONJUNTO DE PAREJAS VÁLIDAS DIRECTAMENTE DESDE LA TABLA
      let validConfigs = [];

      INV_V.forEach(p => {
        if (forceP && p !== forceP) return; // Si P está fijo, solo acepta P
        if (originalP !== 'N' && !futureSets[originalP].has(p)) return;

        const qLoop = isUnary ? [null] : INV_V;
        qLoop.forEach(q => {
          if (forceQ && q !== forceQ) return; // Si Q está fijo, solo acepta Q
          if (!isUnary && originalQ !== 'N' && !futureSets[originalQ].has(q)) return;

          const zCalculado = computeLogic(node.data.operator, [p, q]);

          // Si hay restricción en Z, el resultado de la pareja debe satisfacerla
          if (restrictZ !== 'N') {
            if (futureSets[restrictZ].has(zCalculado)) {
              validConfigs.push([p, q, zCalculado]);
            }
          } else {
            validConfigs.push([p, q, zCalculado]);
          }
        });
      });

      // Manejo de contingencia por contradicción absoluta
      if (validConfigs.length === 0) {
        // En lugar de forzar B, asignamos B al resultado y marcamos a los padres para que se actualicen
        const fallbackVal = 'B';
        validConfigs.push([fallbackVal, fallbackVal, fallbackVal]);
      }

      // 2. OBTENER LA PAREJA UNIFICADA DE COSTO MÍNIMO ABSOLUTO
      // En propagationEngine.js, dentro del loop de nodos:

      // ... (después de construir validConfigs)

      // 2. OBTENER LA PAREJA UNIFICADA DE COSTO MÍNIMO (PASANDO VALORES FIJOS)
      const optimaPair = getHeuristicLowestCostPair(
        validConfigs,
        isUnary,
        originalP, // Pasamos el valor fijo de P
        originalQ  // Pasamos el valor fijo de Q
      );
      console.log(`\nCompuerta ${node.data.operator} (ID: ${node.id}) - Pareja Óptima Encontrada: P=${optimaPair.p}, Q=${optimaPair.q}, Z=${optimaPair.z}`);

      if (optimaPair) {
        // ASIGNACIÓN DE VALORES INDIVIDUALES DERIVADOS DE LA TUPLA MÍNIMA GANADORA
        const padreP = currentNodes.find(n => n.id === idPadreP);
        if (padreP) {
          padreP.data.value = mergeInformation(originalP, optimaPair.p);
          finalSelectorOptions[idPadreP] = [optimaPair.p]; // Fijar opción única del par mínimo
        }

        if (idPadreQ) {
          const padreQ = currentNodes.find(n => n.id === idPadreQ);
          if (padreQ) {
            padreQ.data.value = mergeInformation(originalQ, optimaPair.q);
            finalSelectorOptions[idPadreQ] = [optimaPair.q]; // Fijar opción única del par mínimo
          }
        }

        // Asignar el valor Z unificado a la compuerta y a las hojas de salida
        node.data.value = mergeInformation(userInitialValues.get(node.id), optimaPair.z);
        finalSelectorOptions[node.id] = [optimaPair.z];

        if (outgoingEdge) {
          const hojaNodo = currentNodes.find(n => n.id === outgoingEdge.target);
          if (hojaNodo) {
            hojaNodo.data.value = mergeInformation(userInitialValues.get(outgoingEdge.target), optimaPair.z);
          }
          finalSelectorOptions[outgoingEdge.target] = [optimaPair.z];
        }
      }
    }
  });

  // =========================================================================
  // RETROPROPAGACIÓN DE VARIABLES ESPEJO EN EL LIENZO
  // =========================================================================
  currentNodes.forEach((node, _, srcArray) => {
    if (node.type === 'variable') {
      const twinNode = srcArray.find(
        t => t.type === 'variable' && t.data.label === node.data.label && t.id !== node.id && t.data.value !== 'N'
      );
      if (twinNode) {
        const mergedVal = mergeInformation(node.data.value, twinNode.data.value);
        node.data.value = mergedVal;
        finalSelectorOptions[node.id] = [mergedVal]; // Sincronizar el dropdown de la copia
      }
    }
  });

  // =========================================================================
  // LOG DE REPORTE MATRICIAL (Fiel a tus especificaciones de Python)
  // =========================================================================
  evaluatedCompuertas.forEach(compuertaId => {
    const compuertaNodo = currentNodes.find(n => n.id === compuertaId);
    if (compuertaNodo) {
      const opName = compuertaNodo.data.operator;
      const isUnary = opName === 'NOT';
      const finalValZ = compuertaNodo.data.value;

      console.log(`\n      MATRIZ DE COMPUERTA ACTUAL: ${opName}`);

      if (isUnary) {
        console.log("      P   |   Resultado (NOT P)");
        console.log("    +-------------------------+");
        INV_V.forEach(p => {
          const zCalc = computeLogic(opName, [p]);
          if (futureSets[finalValZ].has(zCalc)) {
            console.log(`      ${p}   |   ${zCalc}`);
          } else {
            console.log(`      ${p}   |   -`);
          }
        });
        console.log("    +-------------------------+");
      } else {
        console.log("      Q=N   Q=T   Q=F   Q=B");
        console.log("    +-------------------------+");
        INV_V.forEach(p => {
          let rowStr = `P=${p} |`;
          INV_V.forEach(q => {
            const zCalc = computeLogic(opName, [p, q]);
            if (futureSets[finalValZ].has(zCalc)) {
              rowStr += `  ${zCalc}   `;
            } else {
              rowStr += "  -    ";
            }
          });
          console.log(rowStr + "|");
        });
        console.log("    +-------------------------+");
      }
    }
  });

  // Mapear las opciones atómicas finales calculadas hacia el dropdown de ReactFlow
  const finalNodes = currentNodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      allowedOptions: finalSelectorOptions[node.id] || [...INV_V]
    }
  }));

  // Sincronizar cables estáticos finales
  const updatedEdges = edges.map(edge => {
    const src = finalNodes.find(n => n.id === edge.source);
    const val = src?.data?.value || 'N';
    return {
      ...edge,
      animated: val !== 'N',
      style: { stroke: valueColors[val] || valueColors['N'], strokeWidth: 3, strokeDasharray: '5,5' },
      data: { ...edge.data, color: valueColors[val] || valueColors['N'], isAnimating: false }
    };
  });

  return { updatedNodes: finalNodes, updatedEdges };
};