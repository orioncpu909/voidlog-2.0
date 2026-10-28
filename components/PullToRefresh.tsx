"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { useStore } from "@/lib/store";
import { TulipLogo } from "./TulipLogo";

// Pull down from the top of any tab to refresh, like a native app, with the refresh animation
// modeled on WHOOP's: the ARTHA logo fades in as you pull; let go past the line and it draws itself
// in with a spinning circle while the app reloads saved data and applies anything that's due (an
// ended trial or month); then it fades up out of view. About 1 second in total, like WHOOP's. Turned
// off while a sheet or full-screen page is open.
// Works with a finger, a mouse (click and drag down), and a trackpad or wheel (scroll up while
// already at the top).
const TRIGGER = 70; // px of (damped) pull needed to refresh
const MAX = 110;
const LOADING_MS = 1000; // a refresh shows the logo for this long in total, exit included (about WHOOP's length)
const MAX_PULL_MS = 3000; // a pull that's never released or finished is cleared after this
const WHEEL_SETTLE_MS = 180; // a trackpad gesture is over once the scrolling stops
const DRAG_SLOP = 8; // a mouse has to move this far down before it counts as a pull, so clicks still work
// The logo slides down from above the screen and stops inside the header: its bottom never goes
// below the bottom of the "ARTHA" wordmark (the wordmark sits 14–38px from the top).
const LOGO_SIZE = 30;
const LOGO_STOP_TOP = 38 - LOGO_SIZE;
// When it's done, the logo fades up out of view (see .ptr-logo-out).
const EXIT_MS = 300;
const REFRESH_MS = LOADING_MS - EXIT_MS; // how long the logo shows before it fades out
// The page itself moves: it follows the pull, settles at HOLD while loading, then springs back.
const HOLD = 44;
const SETTLE_MS = 220;

export function PullToRefresh({ children }: { children: ReactNode }) {
  const { refresh } = useStore();
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const busy = useRef(false);
  const hide = useRef<() => void>(() => {});

  useEffect(() => {
    let distance = 0;
    let doneTimer: ReturnType<typeof setTimeout> | undefined;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    const blocked = () => busy.current || window.scrollY > 0 || !!document.querySelector("[role=dialog]") || document.body.style.overflow === "hidden";
    const setDistance = (d: number) => {
      distance = Math.max(0, Math.min(MAX, d));
      setPull(distance);
    };
    const release = () => {
      if (distance >= TRIGGER) {
        busy.current = true;
        setRefreshing(true);
        refreshRef.current();
        doneTimer = setTimeout(() => hide.current(), REFRESH_MS);
      } else {
        hide.current(); // stopped short of the line
      }
      distance = 0;
    };

    // Finger and mouse: drag down from the top.
    let startY: number | null = null;
    let dragging = false;

    // Clear everything: the refresh finished, or the logo hit its time limit.
    // Pop the logo back up out of view, then clear everything once it's gone.
    hide.current = () => {
      clearTimeout(doneTimer);
      clearTimeout(exitTimer);
      startY = null;
      dragging = false;
      distance = 0;
      busy.current = true; // no new pull until it's fully gone
      document.body.style.userSelect = "";
      setLeaving(true);
      exitTimer = setTimeout(() => {
        busy.current = false;
        setLeaving(false);
        setRefreshing(false);
        setPull(0);
      }, EXIT_MS);
    };
    const begin = (y: number) => {
      startY = blocked() ? null : y;
      dragging = false;
      distance = 0;
    };
    const move = (y: number, e: Event, slop: number) => {
      if (startY === null) return;
      const dy = y - startY;
      if (!dragging && dy < slop) return;
      if (!dragging) {
        // A pull isn't a text selection: clear any highlight and pause selecting until it ends.
        window.getSelection()?.removeAllRanges();
        document.body.style.userSelect = "none";
      }
      dragging = true;
      if (window.scrollY > 0) return setDistance(0);
      setDistance((dy - slop) * 0.5);
      if (e.cancelable) e.preventDefault(); // stop the page from bouncing or selecting text while pulling
    };
    const end = () => {
      if (startY === null) return;
      startY = null;
      if (dragging) {
        document.body.style.userSelect = "";
        release();
      }
      dragging = false;
    };

    const onTouchStart = (e: TouchEvent) => begin(e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => move(e.touches[0].clientY, e, 0);
    let suppressClick = false;
    const onMouseUp = () => {
      if (dragging) {
        // Swallow only the click this same release produces (it fires right after mouseup); if the
        // release lands elsewhere there's no click, so don't let the flag eat the next real one.
        suppressClick = true;
        setTimeout(() => (suppressClick = false), 0);
      }
      end();
    };
    const onMouseDown = (e: MouseEvent) => e.button === 0 && begin(e.clientY);
    const onMouseMove = (e: MouseEvent) => {
      if (startY !== null && e.buttons === 0) return onMouseUp(); // the button was let go outside the window
      move(e.clientY, e, DRAG_SLOP);
    };
    // A mouse drag that turned into a pull shouldn't also click whatever it started on.
    const onClick = (e: MouseEvent) => {
      if (suppressClick) {
        e.stopPropagation();
        e.preventDefault();
        suppressClick = false;
      }
    };

    // Trackpad or wheel: keep scrolling up while already at the top. Only a gesture that starts at
    // the top counts, so a fast scroll up a long page doesn't refresh when its momentum hits the top.
    // The refresh starts the moment the pull crosses the line, without waiting for a trackpad's
    // momentum to die down; the rest of that gesture is then ignored.
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    let gesture: "pull" | "ignore" | null = null;
    const onWheel = (e: WheelEvent) => {
      if (gesture === null) gesture = e.deltaY < 0 && !blocked() ? "pull" : "ignore";
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        if (gesture === "pull") release(); // stopped short of the line: tuck the logo away
        gesture = null;
      }, WHEEL_SETTLE_MS);
      if (gesture !== "pull" || e.deltaY >= 0 || blocked()) return;
      setDistance(distance + -e.deltaY * 0.35);
      if (distance >= TRIGGER) {
        gesture = "ignore";
        release();
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("click", onClick, true);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      clearTimeout(wheelTimer);
      clearTimeout(doneTimer);
      clearTimeout(exitTimer);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  // A pull that's left hanging (held, or a trackpad that stopped short) clears itself. A refresh
  // always ends after REFRESH_MS.
  const pulling = pull > 0 && !refreshing && !leaving;
  useEffect(() => {
    if (!pulling) return;
    const id = setTimeout(() => hide.current(), MAX_PULL_MS);
    return () => clearTimeout(id);
  }, [pulling]);

  const offset = refreshing ? TRIGGER : pull;
  const ready = pull >= TRIGGER;
  const phase = leaving ? "out" : refreshing ? "loading" : pull > 0 ? "pull" : "idle";

  // The page moves with you: it tracks the pull exactly, eases to HOLD while loading, then springs
  // back up (a slight overshoot) when done. No transform at rest, so fixed pop-ups inside the page
  // aren't affected.
  const pageOffset = phase === "pull" ? pull : phase === "loading" ? HOLD : 0;
  const pageTransition =
    phase === "pull" ? "none" : phase === "loading" ? `transform ${SETTLE_MS}ms ease-out` : `transform ${EXIT_MS}ms cubic-bezier(0.34, 1.4, 0.64, 1)`;

  // From fully hidden above the screen to its stop in the header, reached at the refresh line.
  const top = -LOGO_SIZE + (LOGO_STOP_TOP + LOGO_SIZE) * Math.min(1, offset / TRIGGER);
  return (
    <>
      {offset > 0 && (
        // The logo only, no arrow: it fades in as you pull, draws itself in and spins while loading
        // (like WHOOP's refresh logo), and fades up out of view when it's done. No card, border or
        // label on screen (the label is for screen readers).
        <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center" role="status" aria-live="polite">
          <div style={{ transform: `translateY(${top}px)`, transition: "transform 75ms linear" }}>
            <div className={clsx(phase === "out" && "ptr-logo-out")} style={phase === "pull" ? { opacity: Math.min(1, pull / TRIGGER) } : undefined}>
              <TulipLogo size={LOGO_SIZE} loading={refreshing} />
            </div>
            <span className="sr-only">{refreshing ? "Refreshing" : ready ? "Release to refresh" : "Pull to refresh"}</span>
          </div>
        </div>
      )}
      <div
        className="flex flex-1 flex-col"
        style={{ transform: pageOffset || phase !== "idle" ? `translateY(${pageOffset}px)` : undefined, transition: phase === "idle" ? undefined : pageTransition }}
      >
        {children}
      </div>
    </>
  );
}
