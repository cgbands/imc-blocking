import { memo } from "react";
import type { Member, PersonShape } from "../../types";

const SHAPE_SIZE = 1.15; // feet-equivalent; scales naturally with the SVG viewBox zoom

function shapePath(shape: PersonShape, size: number): string {
  const r = size / 2;
  switch (shape) {
    case "square":
      return `M${-r},${-r} L${r},${-r} L${r},${r} L${-r},${r} Z`;
    case "diamond":
      return `M0,${-r} L${r},0 L0,${r} L${-r},0 Z`;
    case "triangle":
      return `M0,${-r} L${r},${r} L${-r},${r} Z`;
    case "star": {
      const points: string[] = [];
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? r : r * 0.45;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        points.push(`${radius * Math.cos(angle)},${radius * Math.sin(angle)}`);
      }
      return `M${points.join(" L")} Z`;
    }
    case "heart":
      return `M0,${r * 0.35} C${-r},${-r * 0.6} ${-r * 0.6},${-r} 0,${-r * 0.25} C${r * 0.6},${-r} ${r},${-r * 0.6} 0,${r * 0.35} Z`;
    case "spade":
      return `M0,${-r} C${r},${-r * 0.2} ${r * 0.6},${r * 0.5} 0,${r * 0.35} C${-r * 0.6},${r * 0.5} ${-r},${-r * 0.2} 0,${-r} Z`;
    case "club":
      return `M0,${-r} A${r * 0.5},${r * 0.5} 0 1,1 ${-0.01},${-r} Z`;
    case "circle":
    default:
      return "";
  }
}

interface PersonIconProps {
  shape: PersonShape;
  color: string;
  size?: number;
}

export const PersonIcon = memo(function PersonIcon({ shape, color, size = SHAPE_SIZE }: PersonIconProps) {
  if (shape === "circle") {
    return <circle r={size / 2} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={0.05} />;
  }
  return <path d={shapePath(shape, size)} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth={0.05} />;
});

interface PersonProps {
  member: Member;
  x: number;
  y: number;
  highlighted?: boolean;
  dimmed?: boolean;
  onSelect?: (memberId: string) => void;
}

export const Person = memo(function Person({ member, x, y, highlighted, dimmed, onSelect }: PersonProps) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      opacity={dimmed ? 0.25 : 1}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect?.(member.id);
      }}
      style={{ cursor: onSelect ? "pointer" : "default" }}
    >
      {/* transparent hit target, larger than the visual icon for touch */}
      <circle r={SHAPE_SIZE * 0.85} fill="transparent" />
      {highlighted && <circle r={SHAPE_SIZE * 0.95} fill="none" stroke="#ffcf4d" strokeWidth={0.18} className="findMePulse" />}
      <PersonIcon shape={member.shape} color={member.color} />
      <g transform={`translate(${SHAPE_SIZE * 0.32}, ${-SHAPE_SIZE * 0.32})`}>
        <PersonIcon shape={member.tagShape} color={member.tagColor} size={SHAPE_SIZE * 0.45} />
      </g>
      <text
        className="personLabel"
        y={SHAPE_SIZE * 1.4}
        textAnchor="middle"
        fontSize={0.85}
      >
        {member.name}
      </text>
    </g>
  );
});
