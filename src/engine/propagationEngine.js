import {
  computeLogic,
  valueColors,
  mergeInformation,
  getHeuristicLowestCostPair,
  INV_V,
  futureSets
} from '../utils/logic';

export const runCalculation = (nodes, edges) => {
  let currentNodes = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      value: n.data.value || 'N',
      allowedOptions: [...INV_V]
    }
  }));

  const userInitialValues = new Map(nodes.map(n => [n.id, n.data.value || 'N']));
  const optionsMap = new Map();
  nodes.forEach(n => optionsMap.set(n.id, new Set(['N']))); // Inicializamos con N siempre
  const evaluatedCompuertas = new Set();

  currentNodes.forEach(node => {
    if (node.type === 'logic') {
      const incomingEdges = edges.filter(e => e.target === node.id);
      if (incomingEdges.length === 0) return;

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

      const forceP = originalP !== 'N' ? originalP : null;
      const forceQ = originalQ !== 'N' ? originalQ : null;

      let restrictZ = userInitialValues.get(node.id);
      const outgoingEdge = edges.find(e => e.source === node.id);
      if (outgoingEdge) {
        const targetNodeValue = userInitialValues.get(outgoingEdge.target);
        if (targetNodeValue !== 'N') restrictZ = targetNodeValue;
      }

      let validConfigs = [];
      INV_V.forEach(p => {
        if (forceP && p !== forceP) return;
        if (originalP !== 'N' && !futureSets[originalP].has(p)) return;

        const qLoop = isUnary ? [null] : INV_V;
        qLoop.forEach(q => {
          if (forceQ && q !== forceQ) return;
          if (!isUnary && originalQ !== 'N' && !futureSets[originalQ].has(q)) return;

          const zCalculado = computeLogic(node.data.operator, [p, q]);
          if (restrictZ === 'N' || futureSets[restrictZ].has(zCalculado)) {
            validConfigs.push([p, q, zCalculado]);

            // Acumular opciones válidas
            optionsMap.get(idPadreP).add(p);
            if (idPadreQ) optionsMap.get(idPadreQ).add(q);
            optionsMap.get(node.id).add(zCalculado);
            if (outgoingEdge) optionsMap.get(outgoingEdge.target).add(zCalculado);
          }
        });
      });

      if (validConfigs.length === 0) validConfigs.push(['B', 'B', 'B']);

      // 2. OBTENER LA PAREJA ÓPTIMA (El motor forzará valores activos gracias a la penalización en logic.js)
      const optimaPair = getHeuristicLowestCostPair(validConfigs, isUnary, originalP, originalQ);

      if (optimaPair) {
        const padreP = currentNodes.find(n => n.id === idPadreP);
        if (padreP) padreP.data.value = mergeInformation(originalP, optimaPair.p);

        if (idPadreQ) {
          const padreQ = currentNodes.find(n => n.id === idPadreQ);
          if (padreQ) padreQ.data.value = mergeInformation(originalQ, optimaPair.q);
        }

        node.data.value = mergeInformation(userInitialValues.get(node.id), optimaPair.z);

        if (outgoingEdge) {
          const hojaNodo = currentNodes.find(n => n.id === outgoingEdge.target);
          if (hojaNodo) hojaNodo.data.value = mergeInformation(userInitialValues.get(outgoingEdge.target), optimaPair.z);
        }
      }
    }
  });

  // Retropropagación de variables espejo
  currentNodes.forEach((node, _, srcArray) => {
    if (node.type === 'variable') {
      const twinNode = srcArray.find(t => t.type === 'variable' && t.data.label === node.data.label && t.id !== node.id && t.data.value !== 'N');
      if (twinNode) {
        node.data.value = mergeInformation(node.data.value, twinNode.data.value);
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

  const finalNodes = currentNodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      allowedOptions: Array.from(optionsMap.get(node.id) || ['N', 'T', 'F', 'B'])
    }
  }));

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