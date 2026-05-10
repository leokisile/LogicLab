export const valueColors = {
  T: "#2ecc71",
  F: "#e74c3c",
  B: "#f39c12",
  N: "#95a5a6",
};

export const mergeInformation = (current, incoming) => {
  if (current === incoming) return current;
  if (current === 'N') return incoming;
  if (incoming === 'N') return current;
  
  // Si llegamos aquí, hay un conflicto (T vs F) o uno ya es B
  return 'B';
};

// tablas lógicas

const AND_TABLE = {
  T: { T: 'T', F: 'F', B: 'B', N: 'N' },
  F: { T: 'F', F: 'F', B: 'F', N: 'F' },
  B: { T: 'B', F: 'F', B: 'B', N: 'N' },
  N: { T: 'N', F: 'F', B: 'N', N: 'N' },
};

const OR_TABLE = {
  T: { T: 'T', F: 'T', B: 'T', N: 'T' },
  F: { T: 'T', F: 'F', B: 'B', N: 'N' },
  B: { T: 'T', F: 'B', B: 'B', N: 'B' },
  N: { T: 'T', F: 'N', B: 'B', N: 'N' },
};

const NOT_TABLE = {
  T: 'F',
  F: 'T',
  B: 'B',
  N: 'N',
};

// motor lógico

export const computeLogic = (operator, inputs) => {
  const a = inputs[0] || 'N';
  const b = inputs[1] || 'N';

  switch (operator) {
    case 'NOT':
      return NOT_TABLE[a];

    case 'AND':
      return AND_TABLE[a][b];

    case 'OR':
      return OR_TABLE[a][b];

    case 'IMPLIES':
      return OR_TABLE[NOT_TABLE[a]][b];

    case 'EQUIV': {
      const left = OR_TABLE[NOT_TABLE[a]][b];
      const right = OR_TABLE[NOT_TABLE[b]][a];
      return AND_TABLE[left][right];
    }

    default:
      return 'N';
  }
};