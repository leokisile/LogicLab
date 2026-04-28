import React from 'react';
import { Handle, Position } from 'reactflow';
import { valueColors } from "../../utils/logic";

export default function LogicNode({ data }) {
  const isBoth = data.value === 'B';

  return (
    <div 
      className={isBoth ? 'both-gradient-bg' : ''}
      style={{
        padding: '12px',
        borderRadius: '8px',
        background: isBoth ? 'transparent' : '#fff',
        border: `3px solid ${isBoth ? '#f39c12' : (valueColors[data.value] || '#333')}`,
        textAlign: 'center',
        minWidth: '80px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
        color: isBoth ? '#fff' : '#000'
      }}
    >
      {/* Entrada de la señal */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ background: '#555', width: '8px', height: '8px' }} 
      />

      <div style={{ 
        fontSize: '11px', 
        opacity: 0.7, 
        fontWeight: 'bold',
        textTransform: 'uppercase' 
      }}>
        {data.operator}
      </div>

      <div style={{ 
        fontSize: '1.2rem', 
        fontWeight: 'bold',
        marginTop: '2px'
      }}>
        {data.value || '?'}
      </div>

      {/* Salida de la señal calculada */}
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          background: isBoth ? '#f39c12' : (valueColors[data.value] || '#333'), 
          width: '8px', 
          height: '8px' 
        }} 
      />
    </div>
  );
}