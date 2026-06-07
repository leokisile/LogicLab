// src/utils/logic.js

export const valueColors = {
  T: "#2ecc71",
  F: "#e74c3c",
  B: "#f39c12",
  N: "#95a5a6",
};

export const INV_V = ['N', 'T', 'F', 'B'];

export const futureSets = {
  'N': new Set(['N', 'T', 'F', 'B']),
  'T': new Set(['T', 'B']),
  'F': new Set(['F', 'B']),
  'B': new Set(['B'])
};

// Heurística de pesos solicitada para la visualización final
export const VALUE_WEIGHTS = {
  'N': 0,
  'T': 1,
  'F': 1,
  'B': 2
};

const AND_TABLE = {
  N: { N: 'N', T: 'N', F: 'F', B: 'F' },
  T: { N: 'N', T: 'T', F: 'F', B: 'B' },
  F: { N: 'F', T: 'F', F: 'F', B: 'F' },
  B: { N: 'F', T: 'B', F: 'F', B: 'B' },
};

const OR_TABLE = {
  N: { N: 'N', T: 'T', F: 'N', B: 'T' },
  T: { N: 'T', T: 'T', F: 'T', B: 'T' },
  F: { N: 'N', T: 'T', F: 'F', B: 'B' },
  B: { N: 'T', T: 'T', F: 'B', B: 'B' },
};

const XOR_TABLE = {
  N: { N: 'N', T: 'T', F: 'N', B: 'T' },
  T: { N: 'T', T: 'N', F: 'T', B: 'N' },
  F: { N: 'N', T: 'T', F: 'N', B: 'T' },
  B: { N: 'T', T: 'N', F: 'T', B: 'N' }
};

const NOT_TABLE = { T: 'F', F: 'T', B: 'B', N: 'N' };

export const mergeInformation = (current, incoming) => {
  if (current === incoming) return current;
  if (current === 'N') return incoming;
  if (incoming === 'N') return current;
  return 'B';
};

export const computeLogic = (operator, inputs) => {
  const a = inputs[0] || 'N';
  const b = inputs[1] || 'N';
  switch (operator) {
    case 'NOT': return NOT_TABLE[a];
    case 'AND': return AND_TABLE[a][b];
    case 'OR': return OR_TABLE[a][b];
    case 'XOR': return XOR_TABLE[a][b];
    case 'IMPLIES': return OR_TABLE[NOT_TABLE[a]][b];
    case 'EQUIV': return AND_TABLE[OR_TABLE[NOT_TABLE[a]][b]][OR_TABLE[NOT_TABLE[b]][a]];
    default: return 'N';
  }
};

export const getMinimalElements = (valuesSet) => {
  if (!valuesSet || valuesSet.size === 0) return new Set();
  if (valuesSet.has('N')) return new Set(['N']);
  
  const minimal = new Set();
  if (valuesSet.has('T')) minimal.add('T');
  if (valuesSet.has('F')) minimal.add('F');
  
  if (minimal.size === 0 && valuesSet.has('B')) {
    minimal.add('B');
  }
  return minimal;
};

/**
 * Heurística para obtener la pareja única (o primera óptima) de costo mínimo
 * Suma los pesos de P y Q (N=0, T/F=1, B=2)
 */
export const getHeuristicLowestCostPair = (validConfigs, isUnary = false) => {
  if (!validConfigs || validConfigs.length === 0) return null;

  let bestConfig = validConfigs[0];
  let minCost = Infinity;

  validConfigs.forEach(c => {
    const costP = VALUE_WEIGHTS[c[0]];
    const costQ = isUnary ? 0 : VALUE_WEIGHTS[c[1]];
    const total = costP + costQ;

    if (total < minCost) {
      minCost = total;
      bestConfig = c;
    }
  });

  return {
    p: bestConfig[0],
    q: bestConfig[1],
    z: bestConfig[2]
  };
};