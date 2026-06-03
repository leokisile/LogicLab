import React from 'react';
import { Handle, Position } from 'reactflow';
import { valueColors } from "../../utils/logic";

export default function OutputNode({ data }) {
  const isBoth = data.value === 'B';
  const options = data.allowedOptions || ['N', 'T', 'F', 'B'];

  return (
    <div
      className={isBoth ? 'both-gradient-bg' : ''}
      style={{
        padding: '15px', borderRadius: '50%', width: '95px', height: '95px',
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: isBoth ? 'transparent' : '#fff',
        border: `4px solid ${isBoth ? '#f39c12' : (valueColors[data.value] || '#333')}`,
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)', color: isBoth ? '#fff' : '#000'
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      <span style={{ fontSize: '0.65rem', fontWeight: 'bold', opacity: 0.6, marginBottom: '2px' }}>RESULT</span>
      
      <select
        value={data.value}
        onChange={(e) => data.onChange(data.id, e.target.value)}
        style={{ width: '80%', padding: '1px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
      >
        {options.includes('N') && <option value="N">None (N)</option>}
        {options.includes('T') && <option value="T">True (T)</option>}
        {options.includes('F') && <option value="F">False (F)</option>}
        {options.includes('B') && <option value="B">Both (B)</option>}
      </select>
    </div>
  );
}