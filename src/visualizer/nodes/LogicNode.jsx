import React from 'react';
import { Handle, Position } from 'reactflow';
import { valueColors } from "../../utils/logic";

export default function LogicNode({ data }) {
  const isBoth = data.value === 'B';
  const options = data.allowedOptions || ['N', 'T', 'F', 'B'];
  const isActivating = data.value !== 'N';

  return (
    <div 
      style={{
        padding: '3px', borderRadius: '11px',
        // Fondo base sólido
        backgroundColor: valueColors[data.value] || '#333',
        minWidth: '110px', 
        boxShadow: isActivating ? `0 0 15px ${isBoth ? '#e74c3c' : (valueColors[data.value] || 'transparent')}` : '0 4px 6px rgba(0,0,0,0.2)',
        transform: isActivating ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.6s ease',
        position: 'relative'
      }}
    >
      {/* CAPA ENVOLVENTE: Gradiente BOTH (Crossfade) */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '11px',
        background: 'linear-gradient(90deg, #e74c3c 50%, #2ecc71 50%)',
        opacity: isBoth ? 1 : 0, // Aparece suavemente si hay colisión
        transition: 'opacity 0.6s ease',
        zIndex: 0
      }} />

      {/* CONTENEDOR BLANCO INTERNO */}
      <div style={{
        position: 'absolute', inset: '3px', borderRadius: '8px', background: '#fff', overflow: 'hidden', zIndex: 0
      }}>
        
        {/* RELLENO ANIMADO 1: Color normal (True/False) */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0,
          width: isActivating ? '100%' : '0%',
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${valueColors[data.value] || 'transparent'} 100%)`,
          opacity: isBoth ? 0 : 0.5, // Desaparece si hay colisión
          transition: 'all 0.9s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease'
        }} />

        {/* RELLENO ANIMADO 2: Gradiente de contradicción (BOTH) */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0,
          width: isActivating ? '100%' : '0%',
          backgroundImage: 'linear-gradient(90deg, #e74c3c 50%, #2ecc71 50%)',
          opacity: isBoth ? 0.6 : 0, // Aparece si hay colisión
          transition: 'all 0.9s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease'
        }} />
      </div>

      <Handle type="target" position={Position.Left} style={{ background: '#555', width: '8px', height: '8px', zIndex: 1 }} />
      
      {/* INTERFAZ FRONTAL */}
      <div style={{ position: 'relative', zIndex: 1, padding: '9px', textAlign: 'center', color: '#000' }}>
        <div style={{ fontSize: '11px', opacity: 0.7, fontWeight: 'bold', textTransform: 'uppercase' }}>
          {data.operator}
        </div>

        <select
          value={data.value}
          onChange={(e) => data.onChange(data.id, e.target.value)}
          className="nodrag"
          style={{ width: '100%', padding: '2px', marginTop: '5px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          {options.includes('N') && <option value="N">None (N)</option>}
          {options.includes('T') && <option value="T">True (T)</option>}
          {options.includes('F') && <option value="F">False (F)</option>}
          {options.includes('B') && <option value="B">Both (B)</option>}
        </select>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          backgroundColor: isBoth ? '#e74c3c' : valueColors[data.value], 
          transition: 'background-color 0.6s ease',
          width: '8px', height: '8px', zIndex: 1 
        }} 
      />
    </div>
  );
}