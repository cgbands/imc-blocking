import type { MicPlacement, Picture, PersonPlacement, Point, PropPlacement } from "../../types";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Eases a handoff so the mic sits with the giver, crosses, then settles with the taker. */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Where a held mic sits relative to its holder's icon. */
export const MIC_ATTACH_OFFSET: Point = { x: -0.85, y: -0.5 };

export function interpolatePeople(a: Picture | undefined, b: Picture | null | undefined, t: number): PersonPlacement[] {
  if (!a) return [];
  if (!b || t <= 0) return a.people;
  const bById = new Map(b.people.map((p) => [p.memberId, p]));
  return a.people.map((pa) => {
    const pb = bById.get(pa.memberId);
    if (!pb) return pa;
    return { memberId: pa.memberId, zone: t < 0.5 ? pa.zone : pb.zone, x: lerp(pa.x, pb.x, t), y: lerp(pa.y, pb.y, t) };
  });
}

export function interpolateProps(a: Picture | undefined, b: Picture | null | undefined, t: number): PropPlacement[] {
  if (!a) return [];
  if (!b || t <= 0) return a.props;
  const bById = new Map(b.props.map((p) => [p.propId, p]));
  return a.props.map((pa) => {
    const pb = bById.get(pa.propId);
    if (!pb) return pa;
    return { propId: pa.propId, x: lerp(pa.x, pb.x, t), y: lerp(pa.y, pb.y, t) };
  });
}

export interface ResolvedMic {
  micId: string;
  x: number;
  y: number;
  /** who is carrying it right now (null once it's standing on its own) */
  holderMemberId: string | null;
  /** true while it's crossing from one carrier to another */
  handingOff: boolean;
}

/**
 * A mic's position is derived, not stored: while someone is holding it, it
 * rides on their icon, so it follows them through a transition for free. A
 * handoff eases from the giver to the taker while both are still moving.
 */
export function resolveMics(
  a: Picture | undefined,
  b: Picture | null | undefined,
  t: number,
  peopleNow: Map<string, Point>,
): ResolvedMic[] {
  if (!a) return [];
  const bById = new Map((b?.mics ?? []).map((m) => [m.micId, m]));

  const heldPoint = (memberId: string, fallback: Point): Point => {
    const person = peopleNow.get(memberId);
    if (!person) return fallback;
    return { x: person.x + MIC_ATTACH_OFFSET.x, y: person.y + MIC_ATTACH_OFFSET.y };
  };

  return a.mics.map((ma): ResolvedMic => {
    const mb = bById.get(ma.micId);
    const holderA = ma.holderMemberId;
    const holderB = mb ? mb.holderMemberId : holderA;

    // Parked on a Picture, or no next Picture: just resolve against the holder.
    if (!mb || t <= 0) {
      const point = holderA ? heldPoint(holderA, ma) : ma;
      return { micId: ma.micId, x: point.x, y: point.y, holderMemberId: holderA, handingOff: false };
    }

    let point: Point;
    let handingOff = false;

    if (holderA && holderB && holderA === holderB) {
      point = heldPoint(holderA, ma); // rides along with them
    } else if (holderA && holderB) {
      const from = heldPoint(holderA, ma);
      const to = heldPoint(holderB, mb);
      const e = smoothstep(t);
      point = { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e) };
      handingOff = true;
    } else if (holderA && !holderB) {
      const from = heldPoint(holderA, ma);
      point = { x: lerp(from.x, mb.x, t), y: lerp(from.y, mb.y, t) }; // put down
    } else if (!holderA && holderB) {
      const to = heldPoint(holderB, mb);
      point = { x: lerp(ma.x, to.x, t), y: lerp(ma.y, to.y, t) }; // picked up
    } else {
      point = { x: lerp(ma.x, mb.x, t), y: lerp(ma.y, mb.y, t) }; // moved on its own
    }

    return {
      micId: ma.micId,
      x: point.x,
      y: point.y,
      holderMemberId: t < 0.5 ? holderA : holderB,
      handingOff,
    };
  });
}

/** Raw stored placements, for the editor (which writes x/y for free mics). */
export function micPlacementsFor(picture: Picture | undefined): MicPlacement[] {
  return picture?.mics ?? [];
}
