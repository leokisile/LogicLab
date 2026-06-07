import React from 'react';
import { Handle, Position } from 'reactflow';
import { valueColors } from "../../utils/logic";
import { useDomain } from "../../domain/useDomain"; // CORREGIDO: Sube a src/ y entra a domain/

export default function VariableNode({ id, data }) {
  const isBoth = data.value === 'B';
  const options = data.allowedOptions || ['N', 'T', 'F', 'B'];
  
  // Consumimos la acción reactiva directamente del store
  const updateNodeValue = useDomain((state) => state.updateNodeValue);

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
        boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ background: '#555', width: '8px', height: '8px' }} 
      />
      
      <div 
        style={{ 
          fontSize: '10px', 
          fontWeight: 'bold', 
          marginBottom: '5px', 
          color: isBoth ? '#fff' : '#666' 
        }}
      >
        VARIABLE ({data.label || 'p'})
      </div>

      <select
        value={data.value}
        onChange={(e) => {
          // Llamada directa a Zustand usando el ID real
          updateNodeValue(id, e.target.value);
        }}
        className="nodrag"
        style={{ 
          width: '100%', 
          padding: '2px', 
          cursor: 'pointer', 
          borderRadius: '4px', 
          border: '1px solid #ccc' 
        }}
      >
        {options.includes('N') && <option value="N">None (N)</option>}
        {options.includes('T') && <option value="T">True (T)</option>}
        {options.includes('F') && <option value="F">False (F)</option>}
        {options.includes('B') && <option value="B">Both (B)</option>}
      </select>

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