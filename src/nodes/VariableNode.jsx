import React from 'react';
import { Handle, Position } from 'reactflow';
import { valueColors } from '../utils/logic';

export default function VariableNode({ data }) {
  const isBoth = data.value === 'B';

  return (
    <div 
      className={isBoth ? 'both-gradient-bg' : ''} 
      style={{
        padding: '10px',
        borderRadius: '8px',
        background: isBoth ? 'transparent' : '#fff',
        border: `3px solid ${isBoth ? '#f39c12' : valueColors[data.value]}`,
        textAlign: 'center',
        minWidth: '100px',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
        position: 'relative'
      }}
    >

      <div style={{ 
        fontSize: '10px', 
        fontWeight: 'bold', 
        marginBottom: '5px',
        color: isBoth ? '#fff' : '#666' 
      }}>
        VARIABLE ({data.label || 'p'})
      </div>

      <select 
        value={data.value} 
        onChange={(e) => data.onChange(data.id, e.target.value)}
        style={{ 
          width: '100%', 
          padding: '2px',
          cursor: 'pointer',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      >
        <option value="N">None (N)</option>
        <option value="T">True (T)</option>
        <option value="F">False (F)</option>
        <option value="B">Both (B)</option>
      </select>

      {/* SALIDA (Derecha) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          background: isBoth ? '#f39c12' : valueColors[data.value], 
          width: '8px', 
          height: '8px' 
        }} 
      />
    </div>
  );
}