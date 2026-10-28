"use client";

import { useId } from "react";
import clsx from "clsx";

// The ARTHA tulip mark in black, from ARTHA's own logo file (public/images/artha-tulip.png, the
// mark without the "ARTHA" wordmark). Just the logo: no border, no color.
//
// The image is shown through two masks so it can animate like WHOOP's refresh logo (their circled
// "W"): the tulip is revealed along traced centerlines (CUP, DROP; they cover every tulip pixel at
// this stroke width), and the circle through an arc.
// - loading: the circle comes in as a spinning arc with a gap while the tulip draws itself in,
//   cup first, then the teardrop.
// - otherwise: the static mark.
const SRC = "/images/artha-tulip.png";
const CUP = "M47.5 33.6 Q37.5 28.2 27.85 27 L27.85 55 A22.1 22.1 0 0 0 72 55 L72 27 Q62.5 28.2 52.5 33.6";
const DROP = "M50 34.5 C46 39.5, 40.4 45.5, 40.4 54 A9.6 9.6 0 0 0 59.6 54 C59.6 45.5, 54 39.5, 50 34.5 Z";
const RING_RADIUS = 46.43; // the middle of the circle's band in the image

export function TulipLogo({ size = 56, loading = false, className }: { size?: number; loading?: boolean; className?: string }) {
  const id = useId().replace(/:/g, "");
  const anim = (name: string) => (loading ? name : undefined);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="ARTHA" className={clsx("select-none", className)}>
      <defs>
        <mask id={`${id}-tulip`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <g fill="none" stroke="#fff" strokeWidth={8.5} strokeLinecap="round" strokeLinejoin="round">
            <path d={CUP} pathLength={1} className={anim("tl-draw-cup")} />
            <path d={DROP} pathLength={1} className={anim("tl-draw-drop")} />
          </g>
        </mask>
        <mask id={`${id}-ring`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="#fff" strokeWidth={8} pathLength={1} transform="rotate(-90 50 50)" className={anim("tl-arc")} />
        </mask>
      </defs>
      <image href={SRC} width="100" height="100" mask={`url(#${id}-tulip)`} />
      <g className={anim("tl-spin")}>
        <image href={SRC} width="100" height="100" mask={`url(#${id}-ring)`} />
      </g>
    </svg>
  );
}
