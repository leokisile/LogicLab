import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { runCalculation } from '../engine/propagationEngine';
import { valueColors } from '../utils/logic';

const getFormulaText = (nodes, edges, nodeId) => {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return "";

  const connectedEdges = edges.filter((e) => e.target === nodeId);

  if (node.type === 'variable' && connectedEdges.length === 0) {
    return node.data.label || 'p';
  }

  const sortedEdges = [...connectedEdges].sort((a, b) => {
    const nodeA = nodes.find(n => n.id === a.source);
    const nodeB = nodes.find(n => n.id === b.source);
    return (nodeA?.position.x || 0) - (nodeB?.position.x || 0);
  });

  const parentFormulas = sortedEdges.map((e) => getFormulaText(nodes, edges, e.source));

  if (node.type === 'variable' && connectedEdges.length > 0) {
    return `${node.data.label}(${parentFormulas[0]})`;
  }

  if (node.type === 'output') {
    return parentFormulas[0] || "?";
  }

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

  updateNodeValue: (nodeId, newValue) => {
    set((state) => {
      const targetNode = state.nodes.find((n) => n.id === nodeId);
      if (!targetNode) return {};

      const updatedNodes = state.nodes.map((node) => {
        const esMismoId = node.id === nodeId;
        const esVariableEspejo = targetNode.type === 'variable' &&
          node.type === 'variable' &&
          node.data.label === targetNode.data.label;

        if (esMismoId || esVariableEspejo) {
          return {
            ...node,
            style: { ...node.style, zIndex: (node.style?.zIndex || 0) + 1 },
            data: {
              ...node.data,
              value: newValue,
              allowedOptions: targetNode.data.allowedOptions || ['N', 'T', 'F', 'B']
            }
          };
        }
        return node;
      });

      return { nodes: updatedNodes };
    });

    get().syncFormula();
  },

  calculate: async () => {
    const { nodes, edges } = get();

    // Guardamos qué nodos tenían un valor puesto por el usuario antes de calcular
    const originalValuesMap = new Map(nodes.map(n => [n.id, n.data.value]));
    

    // ====================================================================
    // REINICIO VISUAL FORZADO: Limpieza profunda de estados
    // ====================================================================
    set({
      nodes: nodes.map(n => ({ 
        ...n, 
        data: { ...n.data, value: 'N' } 
      })),
      edges: edges.map(e => ({ 
        ...e, 
        animated: false,
        style: { stroke: '#95a5a6', strokeWidth: 3 },
        data: { 
          ...e.data, 
          isAnimating: false, 
          isPainted: false, // <--- ESTO LIMPIA EL RASTRO DE COLOR
          color: '#95a5a6',
          animationKey: Date.now() + Math.random() // Fuerza recreación del SVG
        } 
      }))
    });

    // Aumentamos este tiempo a 600ms para asegurar que el navegador procese el "apagado"
    await new Promise(resolve => setTimeout(resolve, 600));
    const { updatedNodes, updatedEdges } = runCalculation(nodes, edges);


    // ====================================================================
    // ALGORITMO BFS: Múltiples epicentros basados en los datos conocidos
    // ====================================================================
    const nodeDepths = {};
    const edgeAnimationMap = {}; 
    let maxDepth = 0;
    const queue = [];

    // 1. Llenamos la cola inicial con TODOS los nodos que el usuario llenó (T, F, B)
    nodes.forEach(n => {
      if (originalValuesMap.get(n.id) !== 'N') {
        queue.push(n.id);
        nodeDepths[n.id] = 0;
      }
    });

    // 2. Fallback: Si el usuario le dio calcular con todo vacío ('N'), empezamos por las variables por defecto
    if (queue.length === 0) {
      nodes.filter(n => n.type === 'variable').forEach(n => {
        queue.push(n.id);
        nodeDepths[n.id] = 0;
      });
    }

    // 3. Propagación de las ondas expansivas
    while (queue.length > 0) {
      const currId = queue.shift();
      const currentDepth = nodeDepths[currId];
      maxDepth = Math.max(maxDepth, currentDepth);

      // Evaluar hacia adelante
      edges.filter(e => e.source === currId).forEach(e => {
        if (nodeDepths[e.target] === undefined) {
          nodeDepths[e.target] = currentDepth + 1;
          edgeAnimationMap[e.id] = { depth: currentDepth + 1, isReversed: false };
          queue.push(e.target);
        } else if (!edgeAnimationMap[e.id]) {
          edgeAnimationMap[e.id] = { depth: currentDepth + 1, isReversed: false };
        }
      });

      // Evaluar hacia atrás (Reversa)
      edges.filter(e => e.target === currId).forEach(e => {
        if (nodeDepths[e.source] === undefined) {
          nodeDepths[e.source] = currentDepth + 1;
          edgeAnimationMap[e.id] = { depth: currentDepth + 1, isReversed: true };
          queue.push(e.source);
        } else if (!edgeAnimationMap[e.id]) {
          edgeAnimationMap[e.id] = { depth: currentDepth + 1, isReversed: true };
        }
      });
    }

    // Encendido de los "epicentros" (Nivel 0)
    set((state) => ({
      nodes: state.nodes.map(n => {
        if (nodeDepths[n.id] === 0) {
          const finalNode = updatedNodes.find(un => un.id === n.id);
          return { ...n, data: { ...n.data, value: finalNode?.data?.value || 'N' } };
        }
        return n;
      })
    }));

    await new Promise(resolve => setTimeout(resolve, 600));

    // Despliegue de animaciones capa por capa
    for (let d = 1; d <= maxDepth; d++) {
      const currentEdges = edges.filter(e => edgeAnimationMap[e.id]?.depth === d);
      if (currentEdges.length === 0) continue;

      set((state) => ({
        edges: state.edges.map(e => {
          if (currentEdges.some(ce => ce.id === e.id)) {
            const finalEdge = updatedEdges.find(ue => ue.id === e.id);
            const finalColor = finalEdge?.data?.color || '#95a5a6';
            const isReversed = edgeAnimationMap[e.id].isReversed;
            
            return { 
              ...e, 
              data: { ...e.data, isAnimating: true, color: finalColor, isReversed, animationKey: Date.now() } 
            };
          }
          return e;
        })
      }));

      await new Promise(resolve => setTimeout(resolve, 850));

      set((state) => {
        const nodesToSync = nodes.filter(n => nodeDepths[n.id] === d);

        const nodesWithStepSync = state.nodes.map(n => {
          if (nodesToSync.some(ns => ns.id === n.id)) {
            const finalNode = updatedNodes.find(un => un.id === n.id);
            return { ...n, data: { ...n.data, value: finalNode?.data?.value || 'N' } };
          }
          return n;
        });

        const updatedEdgesState = state.edges.map(e => {
          if (currentEdges.some(ce => ce.id === e.id)) {
            return { 
              ...e, 
              style: { stroke: e.data.color, strokeWidth: 4 },
              data: { ...e.data, isAnimating: false, isPainted: true } 
            };
          }
          return e;
        });

        return { nodes: nodesWithStepSync, edges: updatedEdgesState };
      });
    }

    // Cierre
    set({
      nodes: updatedNodes.map(n => ({
        ...n,
        style: { ...n.style, zIndex: (n.style?.zIndex || 0) + 1 }
      })),
      edges: updatedEdges.map(e => {
        const isEdgeActive = e.data.color && e.data.color !== '#95a5a6';
        return {
          ...e,
          animated: isEdgeActive, 
          style: { ...e.style, strokeWidth: isEdgeActive ? 4 : 3 },
          data: { ...e.data, isAnimating: false, isPainted: isEdgeActive }
        };
      })
    });

    get().syncFormula();
  },

  onNodesChange: (changes) => {
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }));
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
        type: 'custom',
        animated: false,
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
          get().updateNodeValue(nodeId, val);
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

  clearCircuit: () => {
    const { nodes, edges } = get();

    const clearedNodes = nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        value: 'N',
        allowedOptions: ['N', 'T', 'F', 'B']
      }
    }));

    const clearedEdges = edges.map(edge => ({
      ...edge,
      animated: false,
      style: { stroke: '#95a5a6', strokeWidth: 3 },
      data: { ...edge.data, color: '#95a5a6', isAnimating: false, isPainted: false }
    }));

    set({
      nodes: clearedNodes,
      edges: clearedEdges,
      formula: "Diseña un circuito..."
    });

    get().syncFormula();
  },

  onNodesDelete: () => get().syncFormula(),
  onEdgesDelete: () => get().syncFormula(),
}));