import React from 'react';
import { getSmoothStepPath } from 'reactflow';

export default function AnimatedEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data,
}) {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{ ...style, strokeWidth: 3, opacity: 0.6 }}
      />
      
      {/* Usamos isAnimating para mostrar la bolita */}
      {data?.isAnimating && (
        <circle r="6" fill={data.color || "#2ecc71"}>
          <animateMotion
            // El key basado en Date.now() asegura que la animación se reinicie siempre
            key={`${id}-${data.animationKey}`} 
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