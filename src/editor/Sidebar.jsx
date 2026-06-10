import React from 'react';
import { useDomain } from '../domain/useDomain';

export default function Sidebar() {
  // CORRECCIÓN: Desestructuramos también 'clearCircuit'
  const { addNode, formula, calculate, clearCircuit, exportCircuit, importCircuit } = useDomain();

  const handleLoad = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => importCircuit(e.target.result);
    reader.readAsText(file);
  };

  return (
    <aside className="sidebar">
      <h3>Componentes</h3>
      <button className="btn" onClick={() => addNode('VAR')}>+ Variable</button>
      <button className="btn" onClick={() => addNode('OUT')} style={{ background: '#8e44ad' }}>+ Resultado</button>
      <hr />
      <button className="btn" onClick={() => addNode('LOGIC', 'AND')}>AND (∧)</button>
      <button className="btn" onClick={() => addNode('LOGIC', 'OR')}>OR (∨)</button>
      <button className="btn" onClick={() => addNode('LOGIC', 'NOT')}>NOT (¬)</button>
      <button className="btn" onClick={() => addNode('LOGIC', 'XOR')}>XOR (⊕)</button>
      <button className="btn" onClick={() => addNode('LOGIC', 'IMPLIES')}>IF THEN (→)</button>
      <button className="btn" onClick={() => addNode('LOGIC', 'EQUIV')}>IFF (↔)</button>

      <div className="formula-box">
        <strong>Fórmula:</strong>
        <p style={{ color: '#2ecc71', fontSize: '0.9rem', wordBreak: 'break-all' }}>{formula}</p>
      </div>

      <button className="btn btn-calc" onClick={calculate}>CALCULAR</button>

      {/* Botones de Persistencia */}
      <button className="btn" onClick={exportCircuit} style={{ background: '#3498db' }}>💾 Guardar Diagrama</button>

      <label className="btn" style={{ background: '#2980b9', cursor: 'pointer', display: 'block', textAlign: 'center', marginTop: '5px' }}>
        📂 Cargar Diagrama
        <input type="file" onChange={handleLoad} accept=".json" style={{ display: 'none' }} />
      </label>

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