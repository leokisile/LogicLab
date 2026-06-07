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

  // ACTUALIZADOR GLOBAL UNIFICADO (Disparado directamente por los componentes)
  updateNodeValue: (nodeId, newValue) => {
    console.log("=== 🚀 INICIO DE PROPAGACIÓN EN STORE ===");
    console.log(`[Click Original] ID del Nodo: ${nodeId} -> Nuevo Valor: ${newValue}`);

    set((state) => {
      // 1. Encontrar el nodo que disparó el cambio original
      const targetNode = state.nodes.find((n) => n.id === nodeId);

      if (!targetNode) {
        console.warn(`❌ Error crítico: No se encontró el nodo con ID "${nodeId}" en el store.`);
        return {};
      }

      console.log(`[Nodo Encontrado] Tipo: "${targetNode.type}", Etiqueta/Label: "${targetNode.data?.label}"`);

      // 2. Mapear y registrar qué pasa con cada nodo en el lienzo
      const updatedNodes = state.nodes.map((node) => {

        // REGLA UNIFICADA: Nodo modificado O variable espejo con la misma etiqueta
        const esMismoId = node.id === nodeId;
        const esVariableEspejo = targetNode.type === 'variable' &&
          node.type === 'variable' &&
          node.data.label === targetNode.data.label;

        if (esMismoId || esVariableEspejo) {
          console.log(
            `✨ [MODIFICANDO] Nodo ID: "${node.id}" (${node.data.label || 'sin label'}) | ` +
            `Motivo: ${esMismoId ? "Es el nodo clickeado" : "Es un nodo espejo"} | ` +
            `Valor anterior: "${node.data.value}" -> Valor nuevo: "${newValue}"`
          );

          return {
            ...node,
            // Forzamos un cambio superficial extra en el estilo por si ReactFlow está encachando el componente
            style: { ...node.style, zIndex: (node.style?.zIndex || 0) + 1 },
            data: {
              ...node.data,
              value: newValue,
              allowedOptions: targetNode.data.allowedOptions || ['N', 'T', 'F', 'B']
            }
          };
        }

        // Si no cumple la condición, el nodo pasa de largo intacto
        return node;
      });

      console.log("=== 📦 FIN DEL MAPEO: ESTADO FINAL QUE SE GUARDARÁ ===");
      console.log(updatedNodes.map(n => ({ id: n.id, label: n.data.label, value: n.data.value })));

      return { nodes: updatedNodes };
    });

    // Sincronizar inmediatamente la fórmula del panel izquierdo
    get().syncFormula();
  },

  calculate: async () => {
    const { nodes, edges } = get();

    // MAPA DE VALORES ORIGINALES: Guardamos una fotografía de los valores antes del cálculo
    const originalValuesMap = new Map(nodes.map(n => [n.id, n.data.value]));

    // 1. Ejecutar el motor de cálculo matemático primario
    const { updatedNodes, updatedEdges } = runCalculation(nodes, edges);

    // Resetear el estado visual de animación de todos los cables
    set({ edges: edges.map(e => ({ ...e, data: { ...e.data, isAnimating: false } })) });

    const sortedEdges = [...updatedEdges].sort((a, b) => {
      const nodeA = nodes.find(n => n.id === a.source);
      const nodeB = nodes.find(n => n.id === b.source);
      return (nodeA?.position.x || 0) - (nodeB?.position.x || 0);
    });

    // 2. Animación secuencial de cables (Flujo de izquierda a derecha)
    for (const edge of sortedEdges) {
      const sourceNode = updatedNodes.find(n => n.id === edge.source);
      const val = sourceNode?.data?.value || 'N';

      // Encender pulso de animación en el cable actual
      set((state) => ({
        edges: state.edges.map(e =>
          e.id === edge.id ? {
            ...e,
            data: { ...e.data, isAnimating: true, color: valueColors[val], animationKey: Date.now() }
          } : e
        )
      }));

      // Retraso de renderizado para simular el viaje de la señal eléctrica
      await new Promise(resolve => setTimeout(resolve, 850));

      // IMPACTO EN TIEMPO REAL: Actualizar nodo destino Y sincronizar de inmediato si es espejo
      set((state) => {
        const targetNodeInCalculation = updatedNodes.find(un => un.id === edge.target);
        let newValueForTarget = targetNodeInCalculation?.data?.value || 'N';

        // 🌟 LOGICA DE CONTRADICCIÓN: Si el destino tenía T o F original y recibe su inverso, se convierte en 'B'
        const userOriginalTarget = originalValuesMap.get(edge.target) || 'N';
        if (userOriginalTarget !== 'N' && newValueForTarget !== 'N' && userOriginalTarget !== newValueForTarget) {
          newValueForTarget = 'B';
        }

        const nodesWithStepSync = state.nodes.map(n => {
          // Si es el nodo destino que recibió el impacto del cable
          if (n.id === edge.target) {
            return { ...n, data: { ...n.data, value: newValueForTarget } };
          }

          // 🌟 REGLA DE ESPEJO CORREGIDA: Si el nodo afectado (o cualquiera de sus clones) 
          // tiene la misma etiqueta, debe absorber el nuevo valor (incluyendo 'B' si colapsó)
          if (
            targetNodeInCalculation?.type === 'variable' &&
            n.type === 'variable' &&
            n.data.label === targetNodeInCalculation.data.label
          ) {
            return { ...n, data: { ...n.data, value: newValueForTarget } };
          }

          return n;
        });

        // Apagar el cable actual tras dejar su valor en el nodo
        const updatedEdgesState = state.edges.map(e =>
          e.id === edge.id ? { ...e, data: { ...e.data, isAnimating: false } } : e
        );

        return { nodes: nodesWithStepSync, edges: updatedEdgesState };
      });
    }

    // 3. ESTADO FINAL: Aplicar el cierre del cálculo asegurando consistencia absoluta
    set((state) => {
      // Tomamos la salida del motor y aplicamos la misma verificación para el estado de cierre definitivo
      const finalSyncedNodes = updatedNodes.map((computedNode) => {
        let finalValue = computedNode.data.value || 'N';
        const userOriginalVal = originalValuesMap.get(computedNode.id) || 'N';

        // Mantener el estado 'B' si hubo colisión directa en este nodo
        if (userOriginalVal !== 'N' && finalValue !== 'N' && userOriginalVal !== finalValue) {
          finalValue = 'B';
        }

        if (computedNode.type === 'variable') {
          // Buscamos si alguna de sus copias gemelas adquirió un valor prioritario o mutó a 'B'
          const anyTwinWithValue = updatedNodes.find(
            t => t.type === 'variable' && t.data.label === computedNode.data.label && t.data.value !== 'N'
          );

          if (anyTwinWithValue) {
            let twinVal = anyTwinWithValue.data.value;
            const twinOriginalVal = originalValuesMap.get(anyTwinWithValue.id) || 'N';
            
            if (twinOriginalVal !== 'N' && twinVal !== 'N' && twinOriginalVal !== twinVal) {
              twinVal = 'B';
            }

            // Sincronización familiar: Si cualquiera es 'B', todos se vuelven 'B'
            if (finalValue === 'B' || twinVal === 'B') {
              finalValue = 'B';
            } else {
              finalValue = twinVal;
            }
          }
        }

        return {
          ...computedNode,
          style: { ...computedNode.style, zIndex: (computedNode.style?.zIndex || 0) + 1 }, // Forzar re-render estructural
          data: { ...computedNode.data, value: finalValue }
        };
      });

      return {
        nodes: finalSyncedNodes,
        edges: updatedEdges.map(e => ({
          ...e,
          animated: e.data.value !== 'N',
          data: { ...e.data, isAnimating: false }
        }))
      };
    });

    // Refrescar de forma definitiva el string de la fórmula lógica en el panel lateral
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

        // SOLUCIÓN: Todos los nodos comparten este mismo canal limpio hacia el store
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
      data: { ...edge.data, color: '#95a5a6', isAnimating: false }
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