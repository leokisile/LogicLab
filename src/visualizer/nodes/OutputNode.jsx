import React from 'react';
import { Handle, Position } from 'reactflow';
import { valueColors } from "../../utils/logic";

export default function OutputNode({ data }) {
  const isBoth = data.value === 'B';

  return (
    <div
      className={isBoth ? 'both-gradient-bg' : ''}
      style={{
        padding: '15px',
        borderRadius: '50%', // Forma circular para diferenciarlo
        width: '80px',
        height: '80px',
        boxSizing: 'border-box',
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isBoth ? 'transparent' : '#fff',
        border: `4px solid ${isBoth ? '#f39c12' : (valueColors[data.value] || '#333')}`,
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
        color: isBoth ? '#fff' : '#000'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />

      <span style={{ fontSize: '0.7rem', fontWeight: 'bold', opacity: 0.6 }}>RESULT</span>
      <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.value}</span>
    </div>
  );
}