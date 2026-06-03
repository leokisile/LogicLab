import React from 'react';
import { useDomain } from '../domain/useDomain';

export default function Sidebar() {
  // CORRECCIÓN: Desestructuramos también 'clearCircuit'
  const { addNode, formula, calculate, clearCircuit } = useDomain(); 

  return (
    <aside className="sidebar">
      <h3>Componentes</h3>
      <button className="btn" onClick={() => addNode('VAR')}>+ Variable</button>
      <button className="btn" onClick={() => addNode('OUT')} style={{ background: '#8e44ad' }}>+ Resultado</button>
      <hr />
      <button className="btn" onClick={() => addNode('LOGIC', 'AND')}>AND (∧)</button>
      <button className="btn" onClick={() => addNode('LOGIC', 'OR')}>OR (∨)</button>
      <button className="btn" onClick={() => addNode('LOGIC', 'NOT')}>NOT (¬)</button>
      <button className="btn" onClick={() => addNode('LOGIC', 'IMPLIES')}>IF THEN (→)</button>
      <button className="btn" onClick={() => addNode('LOGIC', 'EQUIV')}>IFF (↔)</button>

      <div className="formula-box">
        <strong>Fórmula:</strong>
        <p style={{ color: '#2ecc71', fontSize: '0.9rem', wordBreak: 'break-all' }}>{formula}</p>
      </div>

      <button className="btn btn-calc" onClick={calculate}>CALCULAR</button>

      {/* === AÑADIR BOTÓN DE LIMPIEZA DESDE AQUÍ === */}
      <button 
        className="btn" 
        onClick={clearCircuit} 
        style={{ 
          marginTop: '10px', 
          background: '#e74c3c', 
          color: 'white', 
          fontWeight: 'bold' 
        }}
      >
        LIMPIAR LIENZO
      </button>
      {/* === HASTA AQUÍ === */}
    </aside>
  );
}