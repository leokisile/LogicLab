export const valueColors = {
  T: "#2ecc71", // Verde
  F: "#e74c3c", // Rojo
  B: "#f39c12", // Naranja (para las flechas/líneas)
  N: "#95a5a6", // Gris
};

export const computeLogic = (operator, inputs) => {
  const a = inputs[0] || 'N';
  const b = inputs[1] || 'N';

  // Si alguno es None, el resultado es None (a menos que definas otra cosa)
  if (a === 'N' || b === 'N') return 'N';

  switch (operator) {
    case 'AND':
      if (a === 'B' || b === 'B') return 'B';
      return (a === 'T' && b === 'T') ? 'T' : 'F';
    
    case 'OR':
      if (a === 'B' || b === 'B') return 'B';
      return (a === 'T' || b === 'T') ? 'T' : 'F';

    case 'NOT':
      if (a === 'B') return 'B';
      return a === 'T' ? 'F' : 'T';

    // --- NUEVOS OPERADORES ---
    case 'IMPLIES': // Si A entonces B (¬A ∨ B)
      if (a === 'B' || b === 'B') return 'B';
      return (a === 'F' || b === 'T') ? 'T' : 'F';

    case 'EQUIV': // A si y solo si B (A = B)
      if (a === 'B' || b === 'B') return 'B';
      return (a === b) ? 'T' : 'F';

    default:
      return 'N';
  }
};