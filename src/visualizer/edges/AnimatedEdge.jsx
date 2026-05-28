import React, { useId } from 'react';
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

  const bubbleColor = data?.color || '#2ecc71';
  
  // Generamos un ID único y estable para las animaciones CSS por cada instancia del Edge (React 19 compatible)
  const animationId = useId();

  // Inyectamos los keyframes dinámicos basados en el Path actual de React Flow.
  // Esto asegura que CSS conozca el camino exacto, adaptándose a curvas y movimientos.
  const inlineStyles = data?.isAnimating ? (
    <style>
      {`
        @keyframes move-particle-${animationId.replace(/:/g, '')} {
          0% {
            offset-distance: 0%;
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            offset-distance: 100%;
            opacity: 0;
          }
        }

        @keyframes ripple-pulse-${animationId.replace(/:/g, '')} {
          0% {
            offset-distance: 0%;
            transform: scale(0);
            opacity: 0.8;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            offset-distance: 15%; /* Controla qué tanto avanza el aro expandiéndose por la línea */
            transform: scale(3.5);
            opacity: 0;
          }
        }

        .animated-particle-${animationId.replace(/:/g, '')} {
          offset-path: path('${edgePath}');
          animation: move-particle-${animationId.replace(/:/g, '')} 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .animated-ripple-${animationId.replace(/:/g, '')} {
          offset-path: path('${edgePath}');
          transform-origin: center;
          animation: ripple-pulse-${animationId.replace(/:/g, '')} 0.6s ease-out forwards;
        }
      `}
    </style>
  ) : null;

  return (
    <>
      {inlineStyles}

      {/* Path base del edge */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{ ...style, strokeWidth: 3, opacity: 0.6 }}
      />

      {data?.isAnimating && (
        <g key={`${id}-${data.animationKey}`}>
          {/* EFECTO 1: Aro expansivo adicional (Ripple/Onda de choque) */}
          <circle
            className={`animated-ripple-${animationId.replace(/:/g, '')}`}
            r="8"
            fill="none"
            stroke={bubbleColor}
            strokeWidth="2"
            style={{
              filter: `drop-shadow(0 0 8px ${bubbleColor})`,
              pointerEvents: 'none',
            }}
          />

          {/* EFECTO 2: Bolita viajera principal */}
          <circle
            className={`animated-particle-${animationId.replace(/:/g, '')}`}
            r="6"
            fill={bubbleColor}
            style={{
              filter: `drop-shadow(0 0 6px ${bubbleColor}) drop-shadow(0 0 3px ${bubbleColor})`,
              pointerEvents: 'none',
            }}
          />
        </g>
      )}
    </>
  );
}