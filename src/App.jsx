import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import Sidebar from './editor/Sidebar';
import Editor from './editor/Editor';
import './App.css';

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="layout-wrapper">
        <Sidebar />
        <Editor />
      </div>
    </ReactFlowProvider>
  );
}