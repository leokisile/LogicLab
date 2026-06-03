import React from 'react';
import { Handle, Position } from 'reactflow';
import { valueColors } from "../../utils/logic";

export default function LogicNode({ data }) {
  const isBoth = data.value === 'B';
  const options = data.allowedOptions || ['N', 'T', 'F', 'B'];

  return (
    <div 
      className={isBoth ? 'both-gradient-bg' : ''}
      style={{
        padding: '12px', borderRadius: '8px',
        background: isBoth ? 'transparent' : '#fff',
        border: `3px solid ${isBoth ? '#f39c12' : (valueColors[data.value] || '#333')}`,
        textAlign: 'center', minWidth: '110px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
        color: isBoth ? '#fff' : '#000'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#555', width: '8px', height: '8px' }} />
      <div style={{ fontSize: '11px', opacity: 0.7, fontWeight: 'bold', textTransform: 'uppercase' }}>
        {data.operator}
      </div>

      <select
        value={data.value}
        onChange={(e) => data.onChange(data.id, e.target.value)}
        style={{ width: '100%', padding: '2px', marginTop: '5px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
      >
        {options.includes('N') && <option value="N">None (N)</option>}
        {options.includes('T') && <option value="T">True (T)</option>}
        {options.includes('F') && <option value="F">False (F)</option>}
        {options.includes('B') && <option value="B">Both (B)</option>}
      </select>

      <Handle type="source" position={Position.Right} style={{ background: isBoth ? '#f39c12' : (valueColors[data.value] || '#333'), width: '8px', height: '8px' }} />
    </div>
  );
}