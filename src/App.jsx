import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import FlowCanvas from './FlowCanvas';

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}