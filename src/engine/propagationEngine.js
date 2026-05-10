import { computeLogic, valueColors } from '../utils/logic';

export const runCalculation = (nodes, edges) => {
  // CLAVE: Copia manual para NO perder las funciones (onChange)
  let currentNodes = nodes.map(n => ({
    ...n,
    data: { ...n.data } 
  }));
  
  const labelsWithInput = new Set(
    currentNodes
      .filter(n => n.type === 'variable' && edges.some(e => e.target === n.id))
      .map(n => n.data.label)
  );

  console.log("%c--- INICIO DE TRAZA LÓGICA ---", "color: #3498db; font-weight: bold;");

  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 50;

  while (changed && iterations < MAX_ITERATIONS) {

    changed= false;
    iterations++;

    const iterationLog = [];

    // A. Propagación Física
    const nextStepNodes = currentNodes.map(node => {
      const inputEdges = edges.filter(e => e.target === node.id);
      if (inputEdges.length === 0) return node;

      const inputValues = inputEdges
        .sort((a, b) => {
          const nA = currentNodes.find(n => n.id === a.source);
          const nB = currentNodes.find(n => n.id === b.source);
          return (nA?.position.y || 0) - (nB?.position.y || 0);
        })
        .map(e => currentNodes.find(n => n.id === e.source)?.data?.value || 'N');

      let newValue = node.type === 'logic' 
        ? computeLogic(node.data.operator, inputValues) 
        : (inputValues[0] || 'N');

      // DEPUREMOS LA EXPRESIÓN
      if (node.type === 'variable') {
        const symbol = "←";
        iterationLog.push(`${node.data.label}(${newValue}) ${symbol} (Entrada: ${inputValues[0]})`);
      }

      if (node.data.value !== newValue) {
        changed = true;
      }

      return { ...node, data: { ...node.data, value: newValue, hasIncomingConnection: true } };
    });

    // B. Sincronización Global
    currentNodes = nextStepNodes.map(node => {
      if (node.type === 'variable' && labelsWithInput.has(node.data.label)) {
        const masterNode = nextStepNodes.find(n => 
          n.type === 'variable' && 
          n.data.label === node.data.label && 
          edges.some(e => e.target === n.id)
        );
        
        if (masterNode) {
          return { ...node, data: { ...node.data, value: masterNode.data.value } };
        }
      }
      return node;
    });
  }

  // --- TRAZA FINAL SOLICITADA ---
  // Ejemplo: p(F)(p(T) ^ q(F)) -- resultado (F)
  const outputVal = currentNodes.find(n => n.type === 'output')?.data?.value || 'N';
  const traceParts = Array.from(labelsWithInput).map(label => {
    const val = currentNodes.find(n => n.data.label === label)?.data.value;
    return `${label}(${val})`;
  });

  console.log(`%c${traceParts.join(", ")} -- resultado (${outputVal})`, "color: #2ecc71; font-weight: bold;");

  const updatedEdges = edges.map(edge => {
    const src = currentNodes.find(n => n.id === edge.source);
    const val = src?.data?.value || 'N';
    return {
      ...edge,
      style: { stroke: valueColors[val], strokeWidth: 3, strokeDasharray: '5,5' },
      data: { ...edge.data, color: valueColors[val], isSequenceActive: false }
    };
  });

  return { updatedNodes: currentNodes, updatedEdges };
};