export const valueColors = {
  T: "#2ecc71", // Verde
  F: "#e74c3c", // Rojo
  B: "#f39c12", // Naranja (para las flechas/líneas)
  N: "#95a5a6", // Gris
};

export const computeLogic = (operator, inputs) => {
  const a = inputs[0] || 'N';
  const b = inputs[1] || 'N';

  // Solo validamos que AMBOS existan si NO es un NOT
  if (operator !== 'NOT' && (a === 'N' || b === 'N')) return 'N';
  // Si es NOT, solo validamos que exista la primera entrada
  if (operator === 'NOT' && a === 'N') return 'N';

  switch (operator) {
    case 'NOT':
      if (a === 'B') return 'B';
      return a === 'T' ? 'F' : 'T';

    case 'AND':
      if (a === 'B' || b === 'B') return 'B';
      return (a === 'T' && b === 'T') ? 'T' : 'F';
    
    case 'OR':
      if (a === 'B' || b === 'B') return 'B';
      return (a === 'T' || b === 'T') ? 'T' : 'F';

    case 'IMPLIES':
      if (a === 'B' || b === 'B') return 'B';
      return (a === 'F' || b === 'T') ? 'T' : 'F';

    case 'EQUIV':
      if (a === 'B' || b === 'B') return 'B';
      return (a === b) ? 'T' : 'F';

    default:
      return 'N';
  }
};