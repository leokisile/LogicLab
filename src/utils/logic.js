export const valueColors = {
  T: "#2ecc71",
  F: "#e74c3c",
  B: "#f39c12",
  N: "#95a5a6",
};
export const VALUE_COSTS = { N: 1, T: 2, F: 2, B: 3 };
const INV_V = ['N', 'F', 'T', 'B'];

export const mergeInformation = (current, incoming) => {
  if (current === incoming) return current;
  if (current === 'N') return incoming;
  if (incoming === 'N') return current;
  
  // Si llegamos aquí, hay un conflicto (T vs F) o uno ya es B
  return 'B';
};

// tablas lógicas

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

const NOT_TABLE = {
  T: 'F',
  F: 'T',
  B: 'B',
  N: 'N',
};

// motor lógico
/**
 * Busca las combinaciones (p, q) que generan targetValue ordenadas por costo mínimo.
 */
export const getSortedCandidates = (operator, targetValue) => {
  const candidates = [];

  if (operator === 'AND' || operator === 'OR') {
    const table = operator === 'AND' ? AND_TABLE : OR_TABLE;
    for (const p of INV_V) {
      for (const q of INV_V) {
        if (table[p]?.[q] === targetValue) {
          candidates.push({ p, q, cost: VALUE_COSTS[p] + VALUE_COSTS[q] });
        }
      }
    }
  } else if (operator === 'IMPLIES' || operator === 'EQUIV') {
    for (const p of INV_V) {
      for (const q of INV_V) {
        if (computeLogic(operator, [p, q]) === targetValue) {
          candidates.push({ p, q, cost: VALUE_COSTS[p] + VALUE_COSTS[q] });
        }
      }
    }
  }
  return candidates.sort((a, b) => a.cost - b.cost);
};

export const getNotCandidate = (targetValue) => {
  for (const key in NOT_TABLE) {
    if (NOT_TABLE[key] === targetValue) return key;
  }
  return 'N';
};

export const computeLogic = (operator, inputs) => {
  const a = inputs[0] || 'N';
  const b = inputs[1] || 'N';
  switch (operator) {
    case 'NOT': return NOT_TABLE[a];
    case 'AND': return AND_TABLE[a][b];
    case 'OR': return OR_TABLE[a][b];
    case 'IMPLIES': return OR_TABLE[NOT_TABLE[a]][b];
    case 'EQUIV': return AND_TABLE[OR_TABLE[NOT_TABLE[a]][b]][OR_TABLE[NOT_TABLE[b]][a]];
    default: return 'N';
  }
};