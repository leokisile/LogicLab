import React from 'react';
import { Handle, Position } from 'reactflow';
import { valueColors } from "../../utils/logic";

export default function OutputNode({ data }) {
  const isBoth = data.value === 'B';
  const options = data.allowedOptions || ['N', 'T', 'F', 'B'];
  const isActivating = data.value !== 'N';

  return (
    <div
      style={{
        padding: '4px', 
        borderRadius: '50%', 
        width: '95px', 
        height: '95px',
        boxSizing: 'border-box',
        backgroundColor: valueColors[data.value] || '#333',
        boxShadow: isActivating ? `0 0 20px ${isBoth ? '#e74c3c' : (valueColors[data.value] || 'transparent')}` : '0 4px 10px rgba(0,0,0,0.3)',
        transform: isActivating ? 'scale(1.08)' : 'scale(1)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.6s ease',
        position: 'relative'
      }}
    >
      {/* CAPA ENVOLVENTE: Gradiente BOTH (Crossfade Circular) */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'linear-gradient(90deg, #e74c3c 50%, #2ecc71 50%)',
        opacity: isBoth ? 1 : 0,
        transition: 'opacity 0.6s ease',
        zIndex: 0
      }} />

      {/* CONTENEDOR BLANCO INTERNO */}
      <div style={{
        position: 'absolute', inset: '4px', borderRadius: '50%', background: '#fff', overflow: 'hidden', zIndex: 0
      }}>
        
        {/* RELLENO ANIMADO 1: Color normal */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0,
          width: isActivating ? '100%' : '0%',
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${valueColors[data.value] || 'transparent'} 100%)`,
          opacity: isBoth ? 0 : 0.5,
          transition: 'all 0.9s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease'
        }} />

        {/* RELLENO ANIMADO 2: Gradiente de contradicción */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0,
          width: isActivating ? '100%' : '0%',
          backgroundImage: 'linear-gradient(90deg, #e74c3c 50%, #2ecc71 50%)',
          opacity: isBoth ? 0.6 : 0,
          transition: 'all 0.9s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease'
        }} />
      </div>

      <Handle type="target" position={Position.Left} style={{ background: '#555', zIndex: 1 }} />
      
      {/* INTERFAZ FRONTAL */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', opacity: 0.6, marginBottom: '2px', color: '#000' }}>RESULT</span>
        
        <select
          value={data.value}
          onChange={(e) => data.onChange(data.id, e.target.value)}
          className="nodrag"
          style={{ width: '80%', padding: '1px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          {options.includes('N') && <option value="N">None (N)</option>}
          {options.includes('T') && <option value="T">True (T)</option>}
          {options.includes('F') && <option value="F">False (F)</option>}
          {options.includes('B') && <option value="B">Both (B)</option>}
        </select>
      </div>
    </div>
  );
}