import type { MicPlacement, Picture, PersonPlacement, PropPlacement } from "../../types";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

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

export function interpolateMics(a: Picture | undefined, b: Picture | null | undefined, t: number): MicPlacement[] {
  if (!a) return [];
  if (!b || t <= 0) return a.mics;
  const bById = new Map(b.mics.map((m) => [m.micId, m]));
  return a.mics.map((ma) => {
    const mb = bById.get(ma.micId);
    if (!mb) return ma;
    return {
      micId: ma.micId,
      holderMemberId: t < 0.5 ? ma.holderMemberId : mb.holderMemberId,
      x: lerp(ma.x, mb.x, t),
      y: lerp(ma.y, mb.y, t),
    };
  });
}
