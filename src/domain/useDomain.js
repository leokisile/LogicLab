import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, ConnectionLineType } from 'reactflow';

// === IMPORTACIÓN CRÍTICA ===
// Esta línea conecta tu Dominio con el Motor de Propagación
import { runCalculation } from '../engine/propagationEngine'; 

// Función auxiliar para construir la fórmula de forma recursiva aaa
const getFormulaText = (nodes, edges, nodeId) => {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return "";
  if (node.type === 'variable') return node.data.label || 'p';

  const connectedEdges = edges.filter((e) => e.target === nodeId);
  const parentFormulas = connectedEdges.map((e) => getFormulaText(nodes, edges, e.source));

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

  // Esta función ahora sí encontrará 'runCalculation'
  calculate: () => {
    const { nodes, edges } = get();
    
    // Ejecución del motor importado
    const { updatedNodes, updatedEdges } = runCalculation(nodes, edges);
    
    set({ 
      nodes: updatedNodes, 
      edges: updatedEdges 
    });
  },

  onNodesChange: (changes) => {
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }));
    get().syncFormula();
  },

  onEdgesChange: (changes) => {
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }));
    get().syncFormula();
  },

  onConnect: (params) => {
    set((state) => ({
      edges: addEdge({
        ...params,
        type: ConnectionLineType.SmoothStep,
        animated: true,
        style: { stroke: '#95a5a6', strokeWidth: 3 }
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
        onChange: (nodeId, val) => {
          set((state) => ({
            nodes: state.nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, value: val } } : n)
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

  // Función para eliminar conexiones manualmente
  deleteEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    }));
    get().syncFormula();
  },

  // Handler para cuando el usuario presiona "Delete" en el teclado
  onNodesDelete: (deletedNodes) => {
    get().syncFormula();
  },

  onEdgesDelete: (deletedEdges) => {
    get().syncFormula();
  },
}));