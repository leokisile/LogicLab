import { computeLogic, valueColors } from '../utils/logic';

export const runCalculation = (nodes, edges) => {
  let currentNodes = [...nodes];

  // Algoritmo de propagación (10 iteraciones para estabilización)
  for (let i = 0; i < 10; i++) {
    currentNodes = currentNodes.map(node => {
      const inputEdges = edges.filter(e => e.target === node.id);
      if (inputEdges.length === 0) return node;

      const inputValues = inputEdges
        .sort((a, b) => {
          const nA = currentNodes.find(n => n.id === a.source);
          const nB = currentNodes.find(n => n.id === b.source);
          return (nA?.position.x || 0) - (nB?.position.x || 0);
        })
        .map(e => currentNodes.find(n => n.id === e.source)?.data?.value || 'N');

      let newValue = node.type === 'logic' 
        ? computeLogic(node.data.operator, inputValues) 
        : (inputValues[0] || 'N');

      return { ...node, data: { ...node.data, value: newValue } };
    });
  }

  // Colorear cables
  const updatedEdges = edges.map(edge => {
    const src = currentNodes.find(n => n.id === edge.source);
    const val = src?.data?.value || 'N';
    return {
      ...edge,
      animated: val !== 'N',
      style: { stroke: valueColors[val], strokeWidth: 3 }
    };
  });

  return { updatedNodes: currentNodes, updatedEdges };
};