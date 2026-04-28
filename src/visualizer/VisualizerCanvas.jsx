import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import { useDomain } from '../domain/useDomain';
import VariableNode from './nodes/VariableNode';
import LogicNode from './nodes/LogicNode';
import OutputNode from './nodes/OutputNode';

const nodeTypes = {
  variable: VariableNode,
  logic: LogicNode,
  output: OutputNode
};

export default function VisualizerCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useDomain();

  return (
    <main className="flow-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        deleteKeyCode={["Backspace", "Delete"]}
        fitView
      >
        <Background color="#333" variant="dots" />
        <Controls />
      </ReactFlow>
    </main>
  );
}