import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Member, Mic, Picture, Prop, StageConfig } from "../../types";
import type { SelectionState } from "../editor/useEditor";
import { Person } from "./Person";
import { PropNode, MicNode } from "./PropAndMic";
import { interpolateMics, interpolatePeople, interpolateProps } from "./interpolate";
import styles from "./StageCanvas.module.css";

interface StageCanvasProps {
  stageConfig: StageConfig;
  picture: Picture | undefined;
  nextPicture?: Picture | null;
  progress?: number;
  membersById: Map<string, Member>;
  propsById: Map<string, Prop>;
  micsById: Map<string, Mic>;
  highlightedMemberId?: string | null;
  isolatedMemberId?: string | null;
  showTrails?: boolean;
  showNames?: boolean;
  onSelectPerson?: (memberId: string) => void;

  /** Editing */
  editMode?: boolean;
  coarsePointer?: boolean;
  selection?: SelectionState;
  onSelectionChange?: (selection: SelectionState) => void;
  onMovePeople?: (moves: { memberId: string; x: number; y: number }[]) => void;
  onMoveProps?: (moves: { propId: string; x: number; y: number }[]) => void;
  snapValue?: (v: number) => number;
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 8;
const DENSE_LABEL_THRESHOLD_PX_PER_FT = 22;
const LABEL_TARGET_PX = 11;
const TAP_SLOP_PX = 5;

const EMPTY_SELECTION: SelectionState = { memberIds: [], propIds: [] };

export function StageCanvas({
  stageConfig,
  picture,
  nextPicture = null,
  progress = 0,
  membersById,
  propsById,
  micsById,
  highlightedMemberId,
  isolatedMemberId,
  showTrails,
  showNames = true,
  onSelectPerson,
  editMode = false,
  coarsePointer = false,
  selection = EMPTY_SELECTION,
  onSelectionChange,
  onMovePeople,
  onMoveProps,
  snapValue = (v) => v,
}: StageCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const marqueeRef = useRef<SVGRectElement | null>(null);

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
  const spaceHeld = useRef(false);

  type DragEntry = { id: string; x: number; y: number; el: SVGGElement };
  const dragState = useRef<{
    pointerId: number;
    startClient: { x: number; y: number };
    startFeet: { x: number; y: number };
    people: DragEntry[];
    props: DragEntry[];
    moved: boolean;
    hitMemberId: string | null;
    additive: boolean;
  } | null>(null);
  const marqueeState = useRef<{ pointerId: number; start: { x: number; y: number }; current: { x: number; y: number } } | null>(null);
  // Captured at pointerdown: once the SVG captures the pointer, later events
  // report the SVG as their target, so the hit test has to be remembered.
  const downInfo = useRef<{ memberId: string | null; clientX: number; clientY: number } | null>(null);

  const applyViewBox = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { cx, cy, scale } = view.current;
    const w = base.width / scale;
    const h = base.height / scale;
    svg.setAttribute("viewBox", `${cx - w / 2} ${cy - h / 2} ${w} ${h}`);

    const pxPerFt = (svg.clientWidth || 1) / w;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    wrapper.classList.toggle(styles.denseZoom, pxPerFt >= DENSE_LABEL_THRESHOLD_PX_PER_FT);

    // Counter-scale label text so it reads at a constant ~11px on screen
    // regardless of zoom. Driven through CSS vars so zooming never re-renders
    // the 106 person nodes.
    const fontFt = Math.min(2.2, Math.max(0.15, LABEL_TARGET_PX / pxPerFt));
    wrapper.style.setProperty("--label-font-size", `${fontFt}px`);
    wrapper.style.setProperty("--label-halo", `${fontFt * 0.22}px`);
    wrapper.style.setProperty("--label-offset", `${0.95 + fontFt * 0.9}px`);
    wrapper.style.setProperty("--label-offset-alt", `${0.95 + fontFt * 2.05}px`);
    wrapper.style.setProperty("--hairline", `${1 / pxPerFt}px`);
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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeld.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeld.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const screenToFeet = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const { cx, cy, scale } = view.current;
      const w = base.width / scale;
      const h = base.height / scale;
      return {
        x: cx - w / 2 + ((clientX - rect.left) / rect.width) * w,
        y: cy - h / 2 + ((clientY - rect.top) / rect.height) * h,
      };
    },
    [base],
  );

  // Registered natively rather than via onWheel: React attaches wheel
  // listeners passively, so preventDefault() there is ignored and the page
  // scrolls behind the stage while zooming.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      const before = screenToFeet(e.clientX, e.clientY);
      view.current.scale = clampScale(view.current.scale * factor);
      const after = screenToFeet(e.clientX, e.clientY);
      view.current.cx += before.x - after.x;
      view.current.cy += before.y - after.y;
      scheduleApply();
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [screenToFeet, scheduleApply]);

  const people = useMemo(() => interpolatePeople(picture, nextPicture, progress), [picture, nextPicture, progress]);
  const propPlacements = useMemo(() => interpolateProps(picture, nextPicture, progress), [picture, nextPicture, progress]);
  const micPlacements = useMemo(() => interpolateMics(picture, nextPicture, progress), [picture, nextPicture, progress]);
  const nextPeopleById = useMemo(() => new Map((nextPicture?.people ?? []).map((p) => [p.memberId, p])), [nextPicture]);

  const selectedMembers = useMemo(() => new Set(selection.memberIds), [selection]);
  const selectedProps = useMemo(() => new Set(selection.propIds), [selection]);

  /** Editing is only safe when parked on a Picture, not mid-transition. */
  const canDragNow = editMode && progress < 0.001;

  // --- Pointer handling ---------------------------------------------------

  const startObjectDrag = (e: React.PointerEvent<SVGSVGElement>, memberId: string | null, propId: string | null) => {
    const svg = svgRef.current;
    if (!svg || !picture) return false;

    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    // Dragging something outside the current selection moves just that thing.
    const inSelection = memberId ? selectedMembers.has(memberId) : propId ? selectedProps.has(propId) : false;
    const memberIds = inSelection ? selection.memberIds : memberId ? [memberId] : [];
    const propIds = inSelection ? selection.propIds : propId ? [propId] : [];

    const collect = (ids: string[], attr: string, placements: { id: string; x: number; y: number }[]): DragEntry[] =>
      ids
        .map((id) => {
          const el = svg.querySelector<SVGGElement>(`[${attr}="${CSS.escape(id)}"]`);
          const placement = placements.find((p) => p.id === id);
          return el && placement ? { id, x: placement.x, y: placement.y, el } : null;
        })
        .filter((v): v is DragEntry => v !== null);

    const peopleEntries = collect(
      memberIds,
      "data-member-id",
      picture.people.map((p) => ({ id: p.memberId, x: p.x, y: p.y })),
    );
    const propEntries = collect(
      propIds,
      "data-prop-id",
      picture.props.map((p) => ({ id: p.propId, x: p.x, y: p.y })),
    );
    if (peopleEntries.length === 0 && propEntries.length === 0) return false;

    dragState.current = {
      pointerId: e.pointerId,
      startClient: { x: e.clientX, y: e.clientY },
      startFeet: screenToFeet(e.clientX, e.clientY),
      people: peopleEntries,
      props: propEntries,
      moved: false,
      hitMemberId: memberId,
      additive,
    };
    return true;
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    const memberId = target.closest("[data-member-id]")?.getAttribute("data-member-id") ?? null;
    const propId = target.closest("[data-prop-id]")?.getAttribute("data-prop-id") ?? null;

    svgRef.current?.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    downInfo.current = { memberId, clientX: e.clientX, clientY: e.clientY };

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      pinchState.current = { distance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), scale: view.current.scale };
      panState.current = null;
      dragState.current = null;
      marqueeState.current = null;
      return;
    }
    if (pointers.current.size > 2) return;

    // 1. Grabbing a person or prop in edit mode moves it.
    if (canDragNow && (memberId || propId) && startObjectDrag(e, memberId, propId)) return;

    // 2. Empty space with a fine pointer in edit mode starts a marquee
    //    (space held, or a non-primary button, falls through to panning).
    if (canDragNow && !coarsePointer && !spaceHeld.current && e.button === 0) {
      const feet = screenToFeet(e.clientX, e.clientY);
      marqueeState.current = { pointerId: e.pointerId, start: feet, current: feet };
      return;
    }

    // 3. Otherwise pan.
    panState.current = { x: e.clientX, y: e.clientY, cx: view.current.cx, cy: view.current.cy };
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchState.current) {
      const pts = Array.from(pointers.current.values());
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const before = screenToFeet(midX, midY);
      view.current.scale = clampScale(pinchState.current.scale * (distance / pinchState.current.distance));
      const after = screenToFeet(midX, midY);
      view.current.cx += before.x - after.x;
      view.current.cy += before.y - after.y;
      scheduleApply();
      return;
    }

    const drag = dragState.current;
    if (drag && drag.pointerId === e.pointerId) {
      const movedPx = Math.hypot(e.clientX - drag.startClient.x, e.clientY - drag.startClient.y);
      if (movedPx > TAP_SLOP_PX) drag.moved = true;
      if (!drag.moved) return;
      const feet = screenToFeet(e.clientX, e.clientY);
      const dx = feet.x - drag.startFeet.x;
      const dy = feet.y - drag.startFeet.y;
      // Written straight to the DOM: a drag never re-renders the 106 nodes.
      for (const entry of [...drag.people, ...drag.props]) {
        entry.el.setAttribute("transform", `translate(${snapValue(entry.x + dx)}, ${snapValue(entry.y + dy)})`);
      }
      return;
    }

    const marquee = marqueeState.current;
    if (marquee && marquee.pointerId === e.pointerId) {
      marquee.current = screenToFeet(e.clientX, e.clientY);
      const rect = marqueeRef.current;
      if (rect) {
        const x = Math.min(marquee.start.x, marquee.current.x);
        const y = Math.min(marquee.start.y, marquee.current.y);
        rect.setAttribute("x", String(x));
        rect.setAttribute("y", String(y));
        rect.setAttribute("width", String(Math.abs(marquee.current.x - marquee.start.x)));
        rect.setAttribute("height", String(Math.abs(marquee.current.y - marquee.start.y)));
        rect.setAttribute("visibility", "visible");
      }
      return;
    }

    if (panState.current && pointers.current.size === 1) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const w = base.width / view.current.scale;
      const h = base.height / view.current.scale;
      view.current.cx = panState.current.cx - ((e.clientX - panState.current.x) / rect.width) * w;
      view.current.cy = panState.current.cy - ((e.clientY - panState.current.y) / rect.height) * h;
      scheduleApply();
    }
  };

  const endPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragState.current;
    if (drag && drag.pointerId === e.pointerId) {
      if (drag.moved) {
        const feet = screenToFeet(e.clientX, e.clientY);
        const dx = feet.x - drag.startFeet.x;
        const dy = feet.y - drag.startFeet.y;
        if (drag.people.length) {
          onMovePeople?.(drag.people.map((p) => ({ memberId: p.id, x: p.x + dx, y: p.y + dy })));
        }
        if (drag.props.length) {
          onMoveProps?.(drag.props.map((p) => ({ propId: p.id, x: p.x + dx, y: p.y + dy })));
        }
      } else {
        // A tap, not a drag — treat it as a selection change.
        const memberId = drag.hitMemberId;
        const propId = drag.props[0]?.id ?? null;
        if (memberId) {
          const already = selectedMembers.has(memberId);
          onSelectionChange?.(
            drag.additive
              ? {
                  memberIds: already ? selection.memberIds.filter((id) => id !== memberId) : [...selection.memberIds, memberId],
                  propIds: selection.propIds,
                }
              : { memberIds: already && selection.memberIds.length === 1 ? [] : [memberId], propIds: [] },
          );
        } else if (propId) {
          onSelectionChange?.({ memberIds: [], propIds: selectedProps.has(propId) ? [] : [propId] });
        }
      }
      dragState.current = null;
    }

    const marquee = marqueeState.current;
    if (marquee && marquee.pointerId === e.pointerId) {
      const x1 = Math.min(marquee.start.x, marquee.current.x);
      const x2 = Math.max(marquee.start.x, marquee.current.x);
      const y1 = Math.min(marquee.start.y, marquee.current.y);
      const y2 = Math.max(marquee.start.y, marquee.current.y);
      const dragged = Math.abs(x2 - x1) > 0.4 || Math.abs(y2 - y1) > 0.4;
      if (dragged && picture) {
        const hit = picture.people.filter((p) => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2);
        const hitProps = picture.props.filter((p) => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2);
        onSelectionChange?.({ memberIds: hit.map((p) => p.memberId), propIds: hitProps.map((p) => p.propId) });
      } else {
        onSelectionChange?.(EMPTY_SELECTION);
      }
      marqueeRef.current?.setAttribute("visibility", "hidden");
      marqueeState.current = null;
    }

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

  // In viewer mode a tap still isolates a person's path — but only a tap,
  // never the tail end of a pan.
  const handleViewerTap = (e: React.PointerEvent<SVGSVGElement>) => {
    const down = downInfo.current;
    downInfo.current = null;
    if (editMode || !onSelectPerson || !down?.memberId) return;
    if (Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) > TAP_SLOP_PX) return;
    onSelectPerson(down.memberId);
  };

  const gridLines = useMemo(() => {
    const spacing = stageConfig.gridSpacingFt;
    if (!spacing) return null;
    const verticals: number[] = [];
    const horizontals: number[] = [];
    for (let x = 0; x <= stageConfig.width; x += spacing) verticals.push(x);
    for (let y = 0; y <= stageConfig.height; y += spacing) horizontals.push(y);
    return { verticals, horizontals };
  }, [stageConfig]);

  return (
    <div ref={wrapperRef} className={styles.wrapper} data-edit={editMode || undefined} data-names={showNames ? "on" : "off"}>
      <svg
        ref={svgRef}
        className={styles.svg}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => {
          handleViewerTap(e);
          endPointer(e);
        }}
        onPointerCancel={endPointer}
      >
        <g>
          <rect x={0} y={0} width={stageConfig.width} height={stageConfig.height} className={styles.floorRect} />
          {stageConfig.wings.map((w) => (
            <rect key={w.side} x={w.x} y={w.y} width={w.width} height={w.height} className={styles.wingRect} />
          ))}

          {gridLines && (
            <g className={styles.gridLines}>
              {gridLines.verticals.map((x) => (
                <line key={`v${x}`} x1={x} y1={0} x2={x} y2={stageConfig.height} />
              ))}
              {gridLines.horizontals.map((y) => (
                <line key={`h${y}`} x1={0} y1={y} x2={stageConfig.width} y2={y} />
              ))}
            </g>
          )}

          {stageConfig.risers.map((r) => (
            <rect key={r.id} x={r.x} y={r.y} width={r.width} height={r.height} className={styles.riserRect} rx={0.3} />
          ))}

          <g className={styles.stairs}>
            {stageConfig.risers.flatMap((r) =>
              r.stairEdges.map((edge) => {
                const treads = 3;
                return Array.from({ length: treads }, (_, i) => {
                  const inset = (i + 1) * 0.28;
                  if (edge === "front" || edge === "back") {
                    const y = edge === "front" ? r.y + r.height + inset : r.y - inset;
                    const pad = r.width * 0.3;
                    return <line key={`${r.id}-${edge}-${i}`} x1={r.x + pad} y1={y} x2={r.x + r.width - pad} y2={y} />;
                  }
                  const x = edge === "left" ? r.x - inset : r.x + r.width + inset;
                  const pad = r.height * 0.15;
                  return <line key={`${r.id}-${edge}-${i}`} x1={x} y1={r.y + pad} x2={x} y2={r.y + r.height - pad} />;
                });
              }),
            )}
          </g>
        </g>

        {showTrails && picture && nextPicture && (
          <g className={styles.trails}>
            {picture.people
              .filter((p) => !isolatedMemberId || p.memberId === isolatedMemberId)
              .map((pa) => {
                const pb = nextPeopleById.get(pa.memberId);
                if (!pb) return null;
                const member = membersById.get(pa.memberId);
                const isolated = isolatedMemberId === pa.memberId;
                return (
                  <line
                    key={pa.memberId}
                    x1={pa.x}
                    y1={pa.y}
                    x2={pb.x}
                    y2={pb.y}
                    stroke={member?.color ?? "#888"}
                    strokeWidth={isolated ? 0.2 : 0.08}
                    opacity={isolated ? 0.9 : 0.35}
                    strokeLinecap="round"
                  />
                );
              })}
          </g>
        )}

        <g>
          {propPlacements.map((placement) => {
            const prop = propsById.get(placement.propId);
            if (!prop) return null;
            return (
              <PropNode
                key={prop.id}
                prop={prop}
                x={placement.x}
                y={placement.y}
                selected={selectedProps.has(prop.id)}
              />
            );
          })}
        </g>

        <g>
          {people.map((placement) => {
            const member = membersById.get(placement.memberId);
            if (!member) return null;
            return (
              <Person
                key={member.id}
                member={member}
                x={placement.x}
                y={placement.y}
                highlighted={highlightedMemberId === member.id}
                dimmed={isolatedMemberId != null && isolatedMemberId !== member.id}
                selected={selectedMembers.has(member.id)}
                forceName={
                  selectedMembers.has(member.id) || isolatedMemberId === member.id || highlightedMemberId === member.id
                }
              />
            );
          })}
        </g>

        <g>
          {micPlacements.map((placement) => {
            const mic = micsById.get(placement.micId);
            if (!mic) return null;
            return <MicNode key={mic.id} mic={mic} x={placement.x} y={placement.y} />;
          })}
        </g>

        <rect ref={marqueeRef} className={styles.marquee} visibility="hidden" x={0} y={0} width={0} height={0} />
      </svg>
    </div>
  );
}
