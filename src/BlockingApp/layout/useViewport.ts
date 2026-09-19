import { useEffect, useState } from "react";

export type LayoutKind = "phone" | "tablet" | "desktop";

export interface Viewport {
  layout: LayoutKind;
  width: number;
  height: number;
  coarsePointer: boolean;
  canHover: boolean;
}

function computeViewport(): Viewport {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const layout: LayoutKind = width < 600 ? "phone" : width < 1100 ? "tablet" : "desktop";
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  return { layout, width, height, coarsePointer, canHover };
}

export function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>(() =>
    typeof window === "undefined"
      ? { layout: "desktop", width: 1200, height: 800, coarsePointer: false, canHover: true }
      : computeViewport(),
  );

  useEffect(() => {
    const update = () => setViewport(computeViewport());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const hoverQuery = window.matchMedia("(hover: hover)");
    pointerQuery.addEventListener("change", update);
    hoverQuery.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      pointerQuery.removeEventListener("change", update);
      hoverQuery.removeEventListener("change", update);
    };
  }, []);

  return viewport;
}
