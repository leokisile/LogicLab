import React from 'react';
import { getSmoothStepPath } from 'reactflow';

export default function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{ ...style, strokeWidth: 3, opacity: 0.6 }}
      />
      
      {data?.isAnimating && (
        <circle r="6" fill={data.color || "#2ecc71"}>
          {/* Eliminamos onEnd para evitar el error de React */}
          <animateMotion
            key={`${id}-${data.isAnimating}`} 
            dur="0.8s"
            repeatCount="1"
            path={edgePath}
            fill="freeze"
            begin="0s"
          />
        </circle>
      )}
    </>
  );
}