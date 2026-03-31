import React, { useCallback, useState } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    addEdge,
    Background,
    Controls,
    ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';

import VariableNode from './nodes/VariableNode';
import LogicNode from './nodes/LogicNode';
import OutputNode from './nodes/OutputNode';
import { computeLogic, valueColors } from './utils/logic';

const nodeTypes = {
    variable: VariableNode,
    logic: LogicNode,
    output: OutputNode
};

export default function FlowCanvas() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [formula, setFormula] = useState("");

    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({
            ...params,
            type: ConnectionLineType.SmoothStep,
            animated: true,
            style: { stroke: '#95a5a6', strokeWidth: 3 }
        }, eds));
    }, [setEdges]);

    /**
     * --- FUNCIÓN DE DEPURACIÓN Y CONVERSIÓN TEXTUAL ---
     * Esta función rastrea hacia atrás desde un nodo hasta encontrar las variables raíz.
     */
    const getFormulaText = (nodeId, depth = 0) => {
        const indent = "  ".repeat(depth); // Sangría para el log
        const node = nodes.find(n => n.id === nodeId);

        if (!node) {
            console.warn(`${indent} [DEBUG] Nodo ${nodeId} no encontrado.`);
            return "";
        }

        const inputEdges = edges.filter(e => e.target === nodeId);
        console.log(`${indent} [DEBUG] Procesando: ${node.data.label || node.data.operator || 'Nodo'} (${node.id})`);

        // CONDICIÓN DE PARADA: Es una variable sin entradas (p, q, r iniciales)
        if (inputEdges.length === 0) {
            const label = node.data.label || "p";
            console.log(`${indent} [DEBUG] -> Encontrada variable raíz: "${label}"`);
            return label;
        }

        // Ordenar por X para procesar de izquierda a derecha
        const sortedInputs = inputEdges.sort((a, b) => {
            const nA = nodes.find(n => n.id === a.source);
            const nB = nodes.find(n => n.id === b.source);
            return (nA?.position.x || 0) - (nB?.position.x || 0);
        });

        // Llamada recursiva para obtener el texto de los nodos padres
        const operands = sortedInputs.map(e => {
            console.log(`${indent} [DEBUG] Subiendo por el cable desde ${node.id} hacia ${e.source}`);
            return getFormulaText(e.source, depth + 1);
        });

        // Si es el nodo circular de RESULTADO, solo devuelve lo que le llega
        if (node.type === 'output') {
            const res = operands[0] || "?";
            console.log(`${indent} [DEBUG] <- Resultado del canal: ${res}`);
            return res;
        }

        const symbols = { AND: '∧', OR: '∨', NOT: '¬', IMPLIES: '→', EQUIV: '↔' };
        const op = symbols[node.data.operator] || node.data.operator;

        let resultFormula = "";

        if (node.data.operator === 'NOT') {
            resultFormula = `¬(${operands[0] || '?'})`;
        } else if (operands.length === 2) {
            // AGRUPACIÓN INCREMENTAL: (A op B)
            resultFormula = `(${operands[0]} ${op} ${operands[1]})`;
        } else {
            resultFormula = operands[0] || '?';
        }

        console.log(`${indent} [DEBUG] <- Estructura armada: ${resultFormula}`);
        return resultFormula;
    };

    /**
     * --- MOTOR DE CÁLCULO ---
     * Propaga los valores booleanos por el circuito.
     */
    const handleCalculate = () => {
        console.log("%c--- INICIANDO CÁLCULO LÓGICO ---", "color: #2ecc71; font-weight: bold;");
        let currentNodes = [...nodes];

        // 10 iteraciones para asegurar que el valor 'viaje' por todo el grafo
        for (let i = 0; i < 10; i++) {
            currentNodes = currentNodes.map(node => {
                const inputEdges = edges.filter(e => e.target === node.id);

                // Si no tiene entradas, es una variable de entrada manual
                if (inputEdges.length === 0) return node;

                const inputValues = inputEdges
                    .sort((a, b) => {
                        const nA = currentNodes.find(n => n.id === a.source);
                        const nB = currentNodes.find(n => n.id === b.source);
                        return (nA?.position.x || 0) - (nB?.position.x || 0);
                    })
                    .map(e => currentNodes.find(n => n.id === e.source)?.data?.value || 'N');

                let newValue;
                if (node.type === 'logic') {
                    newValue = computeLogic(node.data.operator, inputValues);
                } else {
                    newValue = inputValues[0] || 'N';
                }
                return { ...node, data: { ...node.data, value: newValue } };
            });
        }

        setNodes(currentNodes);

        // Actualizar la interfaz con la fórmula final
        const outputs = currentNodes.filter(n => n.type === 'output');
        const fullFormula = outputs.map(o => {
            const txt = getFormulaText(o.id);
            return `${txt} = ${o.data.value}`;
        }).join(' | ');

        setFormula(fullFormula || "Diseña un circuito y conecta el Resultado");

        // Colorear cables según el estado (True = Verde, False = Rojo, None = Gris)
        setEdges(eds => eds.map(edge => {
            const src = currentNodes.find(n => n.id === edge.source);
            const val = src?.data?.value || 'N';
            return {
                ...edge,
                animated: val !== 'N',
                style: { stroke: valueColors[val], strokeWidth: 3 }
            };
        }));
    };

    const addNode = (type, op = '') => {
        const id = `n_${Math.random().toString(36).substr(2, 5)}`;
        let label = type === 'VAR' ? prompt("Etiqueta (p, q, r...):") || "p" : op;
        const newNode = {
            id,
            type: type === 'VAR' ? 'variable' : (type === 'OUT' ? 'output' : 'logic'),
            position: { x: 250, y: 150 },
            data: {
                id, value: 'N', operator: op, label,
                onChange: (nodeId, val) => setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, data: { ...n.data, value: val } } : n))
            }
        };
        setNodes(nds => nds.concat(newNode));
    };
    const isValidConnection = (connection) => {
        const targetNode = nodes.find((n) => n.id === connection.target);
        // Si el nodo al que quiero conectar es una variable, NO permitir
        if (targetNode && targetNode.type === 'variable') {
            return false;
        }
        return true;
    };

    return (
        <div className="layout-wrapper">
            <aside className="sidebar">
                <h2>Logic Lab</h2>
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
                    <p style={{ color: '#2ecc71', fontSize: '0.9rem' }}>{formula}</p>
                </div>

                <button className="btn btn-calc" onClick={handleCalculate}>CALCULAR</button>
            </aside>

            <main className="flow-container">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    deleteKeyCode={["Backspace", "Delete"]}
                    fitView
                >
                    <Background color="#333" variant="dots" />
                    <Controls />
                </ReactFlow>
            </main>
        </div>
    );
}