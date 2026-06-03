import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, ConnectionLineType } from 'reactflow';
import { runCalculation } from '../engine/propagationEngine';
import { valueColors } from '../utils/logic';

// Función auxiliar para construir la fórmula de forma recursiva
const getFormulaText = (nodes, edges, nodeId) => {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return "";

  const connectedEdges = edges.filter((e) => e.target === nodeId);

  // Si es una variable SIN entrada, es un término atómico (p, q, r)
  if (node.type === 'variable' && connectedEdges.length === 0) {
    return node.data.label || 'p';
  }

  // Si tiene entradas, ordenamos y procesamos
  const sortedEdges = [...connectedEdges].sort((a, b) => {
    const nodeA = nodes.find(n => n.id === a.source);
    const nodeB = nodes.find(n => n.id === b.source);
    return (nodeA?.position.x || 0) - (nodeB?.position.x || 0);
  });

  const parentFormulas = sortedEdges.map((e) => getFormulaText(nodes, edges, e.source));

  // CASO ESPECIAL: Variable con entrada (Asignación)
  // Mostramos el nombre de la variable y lo que tiene "atrás"
  if (node.type === 'variable' && connectedEdges.length > 0) {
    return `${node.data.label}(${parentFormulas[0]})`;
  }

  // CASO: Nodo de salida/resultado
  if (node.type === 'output') {
    return parentFormulas[0] || "?";
  }

  // CASO: Compuertas Lógicas
  const ops = { AND: '∧', OR: '∨', NOT: '¬', IMPLIES: '→', EQUIV: '↔' };
  const symbol = ops[node.data.operator] || node.data.operator;

  if (node.data.operator === 'NOT') {
    return `${symbol}(${parentFormulas[0] || '?'})`;
  }
  return `(${parentFormulas[0] || '?'} ${symbol} ${parentFormulas[1] || '?'})`;
};

export const useDomain = create((set, get) => ({
  nodes: [],
  edges: [],
  formula: "Diseña un circuito...",

  syncFormula: () => {
    const { nodes, edges } = get();
    const outputNode = nodes.find(n => n.type === 'output');
    if (outputNode) {
      const edge = edges.find(e => e.target === outputNode.id);
      const text = edge ? getFormulaText(nodes, edges, edge.source) : "Conecta al resultado";
      set({ formula: text });
    }
  },

  calculate: async () => {
    const { nodes, edges } = get();
    const { updatedNodes, updatedEdges } = runCalculation(nodes, edges);

    set({ edges: edges.map(e => ({ ...e, data: { ...e.data, isAnimating: false } })) });

    const sortedEdges = [...updatedEdges].sort((a, b) => {
      const nodeA = nodes.find(n => n.id === a.source);
      const nodeB = nodes.find(n => n.id === b.source);
      return (nodeA?.position.x || 0) - (nodeB?.position.x || 0);
    });

    for (const edge of sortedEdges) {
      const sourceNode = updatedNodes.find(n => n.id === edge.source);
      const val = sourceNode?.data?.value || 'N';

      set((state) => ({
        edges: state.edges.map(e =>
          e.id === edge.id ? {
            ...e,
            data: { ...e.data, isAnimating: true, color: valueColors[val], animationKey: Date.now() }
          } : e
        )
      }));

      await new Promise(resolve => setTimeout(resolve, 850));

      // Impacto en el nodo destino y APAGAMOS la bolita
      set((state) => ({
        nodes: state.nodes.map(n => {
          if (n.id === edge.target) {
            const newNode = updatedNodes.find(un => un.id === n.id);
            return { ...n, data: { ...n.data, value: newNode.data.value } };
          }
          return n;
        }),
        edges: state.edges.map(e => e.id === edge.id ? { ...e, data: { ...e.data, isAnimating: false } } : e)
      }));
    }

    set({
      nodes: updatedNodes,
      edges: updatedEdges.map(e => ({ ...e, animated: e.data.value !== 'N', data: { ...e.data, isAnimating: false } }))
    });
    get().syncFormula();
  },

  onNodesChange: (changes) => {
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }));

    // Si el cambio es de posición, recalculamos la fórmula
    if (changes.some(c => c.type === 'position')) {
      get().syncFormula();
    }
  },

  onEdgesChange: (changes) => {
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }));
    get().syncFormula();
  },

  onConnect: (params) => {
    set((state) => ({
      edges: addEdge({
        ...params,
        type: 'custom', // Usar el tipo personalizado por defecto
        animated: false, // Quitamos la animación de puntos de React Flow para usar la nuestra
        style: { stroke: '#95a5a6', strokeWidth: 3 },
        data: { isAnimating: false }
      }, state.edges),
    }));
    get().syncFormula();
  },

  addNode: (type, op = '') => {
    const id = `n_${Math.random().toString(36).substr(2, 5)}`;
    let label = type === 'VAR' ? prompt("Etiqueta (p, q, r...):") || "p" : op;

    const newNode = {
      id,
      type: type === 'VAR' ? 'variable' : (type === 'OUT' ? 'output' : 'logic'),
      position: { x: 100, y: 100 },
      data: {
        id,
        value: 'N',
        operator: op,
        label,
        allowedOptions: ['N', 'T', 'F', 'B'],
        onChange: (nodeId, val) => {
          set((state) => ({
            nodes: state.nodes.map(n => {
              // Sincronización monotónica de variables espejo
              if (n.id === nodeId || (n.type === 'variable' && n.data.label === state.nodes.find(x => x.id === nodeId)?.data?.label)) {
                return { ...n, data: { ...n.data, value: val } };
              }
              return n;
            })
          }));
          get().syncFormula();
        }
      }
    };
    set((state) => ({ nodes: state.nodes.concat(newNode) }));
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }));
    get().syncFormula();
  },

  deleteEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    }));
    get().syncFormula();
  },

  onNodesDelete: () => get().syncFormula(),
  onEdgesDelete: () => get().syncFormula(),
}));