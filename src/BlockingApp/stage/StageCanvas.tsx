import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Member, Picture, StageConfig } from "../../types";
import { Person } from "./Person";
import styles from "./StageCanvas.module.css";

interface StageCanvasProps {
  stageConfig: StageConfig;
  picture: Picture | undefined;
  membersById: Map<string, Member>;
  highlightedMemberId?: string | null;
  onSelectPerson?: (memberId: string) => void;
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 8;
const DENSE_LABEL_THRESHOLD_PX_PER_FT = 22;

export function StageCanvas({ stageConfig, picture, membersById, highlightedMemberId, onSelectPerson }: StageCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const base = useMemo(() => {
    const margin = 12;
    return {
      x: -margin,
      y: -margin * 0.4,
      width: stageConfig.width + margin * 2,
      height: stageConfig.height + margin * 0.8,
    };
  }, [stageConfig]);

  // view state lives in a ref so pan/zoom never triggers a React re-render
  const view = useRef({ cx: base.x + base.width / 2, cy: base.y + base.height / 2, scale: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchState = useRef<{ distance: number; scale: number } | null>(null);
  const panState = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const rafPending = useRef(false);

  const applyViewBox = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { cx, cy, scale } = view.current;
    const w = base.width / scale;
    const h = base.height / scale;
    svg.setAttribute("viewBox", `${cx - w / 2} ${cy - h / 2} ${w} ${h}`);

    const pxPerFt = (svg.clientWidth || 1) / w;
    const dense = pxPerFt >= DENSE_LABEL_THRESHOLD_PX_PER_FT;
    wrapperRef.current?.classList.toggle(styles.denseZoom, dense);
  }, [base]);

  const scheduleApply = useCallback(() => {
    if (rafPending.current) return;
    rafPending.current = true;
    requestAnimationFrame(() => {
      rafPending.current = false;
      applyViewBox();
    });
  }, [applyViewBox]);

  useEffect(() => {
    view.current = { cx: base.x + base.width / 2, cy: base.y + base.height / 2, scale: 1 };
    applyViewBox();
  }, [base, applyViewBox]);

  useEffect(() => {
    const onResize = () => scheduleApply();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [scheduleApply]);

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const screenToFeet = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const { cx, cy, scale } = view.current;
    const w = base.width / scale;
    const h = base.height / scale;
    const vbX = cx - w / 2;
    const vbY = cy - h / 2;
    return {
      x: vbX + ((clientX - rect.left) / rect.width) * w,
      y: vbY + ((clientY - rect.top) / rect.height) * h,
    };
  };

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0015);
    const before = screenToFeet(e.clientX, e.clientY);
    view.current.scale = clampScale(view.current.scale * factor);
    const after = screenToFeet(e.clientX, e.clientY);
    view.current.cx += before.x - after.x;
    view.current.cy += before.y - after.y;
    scheduleApply();
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      panState.current = { x: e.clientX, y: e.clientY, cx: view.current.cx, cy: view.current.cy };
    } else if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      pinchState.current = { distance: Math.hypot(dx, dy), scale: view.current.scale };
      panState.current = null;
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const distance = Math.hypot(dx, dy);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      if (pinchState.current) {
        const before = screenToFeet(midX, midY);
        view.current.scale = clampScale(pinchState.current.scale * (distance / pinchState.current.distance));
        const after = screenToFeet(midX, midY);
        view.current.cx += before.x - after.x;
        view.current.cy += before.y - after.y;
        scheduleApply();
      }
      return;
    }

    if (panState.current && pointers.current.size === 1) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const w = base.width / view.current.scale;
      const h = base.height / view.current.scale;
      const dxFt = ((e.clientX - panState.current.x) / rect.width) * w;
      const dyFt = ((e.clientY - panState.current.y) / rect.height) * h;
      view.current.cx = panState.current.cx - dxFt;
      view.current.cy = panState.current.cy - dyFt;
      scheduleApply();
    }
  };

  const endPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      const [remaining] = Array.from(pointers.current.values());
      panState.current = { x: remaining.x, y: remaining.y, cx: view.current.cx, cy: view.current.cy };
      pinchState.current = null;
    } else if (pointers.current.size === 0) {
      panState.current = null;
      pinchState.current = null;
    }
  };

  const people = picture?.people.filter((p) => p.zone === "stage") ?? [];
  const wingPeople = picture?.people.filter((p) => p.zone !== "stage") ?? [];

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <svg
        ref={svgRef}
        className={styles.svg}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
      >
        <g className={styles.floor}>
          <rect x={0} y={0} width={stageConfig.width} height={stageConfig.height} className={styles.floorRect} />
          {stageConfig.wings.map((w) => (
            <rect key={w.side} x={w.x} y={w.y} width={w.width} height={w.height} className={styles.wingRect} />
          ))}
          {stageConfig.risers.map((r) => (
            <rect key={r.id} x={r.x} y={r.y} width={r.width} height={r.height} className={styles.riserRect} rx={0.3} />
          ))}
        </g>

        <g>
          {[...people, ...wingPeople].map((placement) => {
            const member = membersById.get(placement.memberId);
            if (!member) return null;
            return (
              <Person
                key={member.id}
                member={member}
                x={placement.x}
                y={placement.y}
                highlighted={highlightedMemberId === member.id}
                onSelect={onSelectPerson}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
