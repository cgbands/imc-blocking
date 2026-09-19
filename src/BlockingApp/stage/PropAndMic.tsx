import { memo } from "react";
import type { Mic, Prop } from "../../types";

interface PropNodeProps {
  prop: Prop;
  x: number;
  y: number;
}

export const PropNode = memo(function PropNode({ prop, x, y }: PropNodeProps) {
  const shape =
    prop.kind === "circle" ? (
      <ellipse rx={prop.width / 2} ry={prop.height / 2} fill={prop.color} opacity={0.85} stroke="rgba(0,0,0,0.3)" strokeWidth={0.05} />
    ) : (
      <rect
        x={-prop.width / 2}
        y={-prop.height / 2}
        width={prop.width}
        height={prop.height}
        rx={0.2}
        fill={prop.color}
        opacity={0.85}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={0.05}
      />
    );
  return (
    <g transform={`translate(${x}, ${y})`}>
      {shape}
      <text className="propLabel" y={prop.height / 2 + 1.1} textAnchor="middle" fontSize={0.75}>
        {prop.name}
      </text>
    </g>
  );
});

interface MicNodeProps {
  mic: Mic;
  x: number;
  y: number;
}

export const MicNode = memo(function MicNode({ mic, x, y }: MicNodeProps) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-0.07} y={0.25} width={0.14} height={0.9} fill="#3a3a3a" />
      <circle r={0.32} fill="#1f1f1f" stroke="#fff" strokeWidth={0.05} />
      <text className="propLabel" y={-0.55} textAnchor="middle" fontSize={0.7}>
        {mic.label}
      </text>
    </g>
  );
});
