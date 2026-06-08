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
  const animationId = useId().replace(/:/g, '');
  const isPainted = data?.isPainted || (style?.stroke && style.stroke !== '#95a5a6');

  // NUEVO: Bandera para saber si la onda expansiva viaja hacia atrás
  const isReversed = data?.isReversed || false;

  const inlineStyles = data?.isAnimating ? (
    <style>
      {`
        @keyframes move-particle-${animationId} {
          /* Si está en reversa, inicia en 100% y viaja al 0% */
          0% { offset-distance: ${isReversed ? '100%' : '0%'}; opacity: 1; }
          80% { opacity: 1; }
          100% { offset-distance: ${isReversed ? '0%' : '100%'}; opacity: 0; }
        }

        @keyframes ripple-pulse-${animationId} {
          0% { offset-distance: ${isReversed ? '100%' : '0%'}; transform: scale(0); opacity: 0.8; }
          50% { opacity: 0.4; }
          100% { offset-distance: ${isReversed ? '85%' : '15%'}; transform: scale(3.5); opacity: 0; }
        }

        @keyframes draw-line-${animationId} {
          /* Para dibujar en reversa, empezamos desde -100 */
          0% { stroke-dashoffset: ${isReversed ? '-100' : '100'}; }
          100% { stroke-dashoffset: 0; }
        }

        .animated-particle-${animationId} {
          offset-path: path('${edgePath}');
          animation: move-particle-${animationId} 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        .animated-ripple-${animationId} {
          offset-path: path('${edgePath}');
          transform-origin: center;
          animation: ripple-pulse-${animationId} 0.6s ease-out forwards;
        }

        .animated-path-${animationId} {
          animation: draw-line-${animationId} 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}
    </style>
  ) : null;

  return (
    <>
      {inlineStyles}

      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{ 
          ...style, 
          strokeWidth: isPainted ? 4 : 3, 
          opacity: isPainted ? 1 : 0.6,
          stroke: isPainted ? bubbleColor : '#95a5a6',
          filter: isPainted ? `drop-shadow(0 0 5px ${bubbleColor})` : 'none',
          transition: 'stroke 0.1s ease'
        }}
      />

      {data?.isAnimating && (
        <g key={`${id}-${data.animationKey}`}>
          <path
            d={edgePath}
            className={`animated-path-${animationId}`}
            pathLength="100"
            style={{
              stroke: bubbleColor,
              strokeWidth: 4,
              strokeDasharray: '100',
              strokeDashoffset: isReversed ? '-100' : '100',
              fill: 'none',
              filter: `drop-shadow(0 0 5px ${bubbleColor})`,
              pointerEvents: 'none'
            }}
          />

          <circle
            className={`animated-ripple-${animationId}`}
            r="8"
            fill="none"
            stroke={bubbleColor}
            strokeWidth="2"
            style={{
              filter: `drop-shadow(0 0 8px ${bubbleColor})`,
              pointerEvents: 'none',
            }}
          />

          <circle
            className={`animated-particle-${animationId}`}
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