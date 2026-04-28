import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

import { useDomain } from '../domain/useDomain';
import VariableNode from '../visualizer/nodes/VariableNode';
import LogicNode from '../visualizer/nodes/LogicNode';
import OutputNode from '../visualizer/nodes/OutputNode';
import AnimatedEdge from '../visualizer/edges/AnimatedEdge';

// Definimos los tipos de nodos fuera del componente
const nodeTypes = {
  variable: VariableNode,
  logic: LogicNode,
  output: OutputNode,
};

const edgeTypes = {
  custom: AnimatedEdge,
};

export default function Editor() {
  // Extraemos el estado y los handlers del store global
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    syncFormula // Extraemos syncFormula para actualizar la UI tras borrar
  } = useDomain();

  return (
    <main className="flow-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange} 
        onEdgesChange={onEdgesChange} 
        onConnect={onConnect}         
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        
        // --- CONFIGURACIÓN PARA ELIMINACIÓN ---
        // Al borrar nodos o conexiones con la tecla Backspace/Delete, 
        // disparamos la actualización de la fórmula.
        onNodesDelete={() => syncFormula()}
        onEdgesDelete={() => syncFormula()}
        deleteKeyCode={["Backspace", "Delete"]}
        
        fitView
        nodesDraggable={true}
        nodesConnectable={true}
        selectNodesOnDrag={true}
      >
        <Background color="#333" variant="dots" />
        <Controls />
      </ReactFlow>
    </main>
  );
}