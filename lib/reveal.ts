"use client";

import { useEffect, useRef } from "react";

// When a pull-down opens, scroll just enough that the whole opened section is on screen, so the
// member doesn't have to scroll to read it. Never past the section's own top: if it's taller than the
// screen, its title row stays in view and the rest is a scroll away. Bars that sit over the page (the
// header, the Book date strip, the tab bar) are marked data-top-bar / data-bottom-bar and are
// treated as covered space.
const GAP = 12;

function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if ((overflowY === "auto" || overflowY === "scroll") && p.scrollHeight > p.clientHeight) return p;
  }
  return null; // the page itself
}

export function reveal(el: HTMLElement | null) {
  if (!el) return;
  // Wait for the opened content to lay out.
  requestAnimationFrame(() => {
    const box = el.getBoundingClientRect();
    if (!box.height) return; // a hidden copy of a tab
    const parent = scrollParent(el);
    const area = parent ? parent.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
    let top = area.top;
    let bottom = area.bottom;
    const onScreen = (r: DOMRect) => r.width > 0 && r.left < window.innerWidth && r.right > 0 && r.bottom > area.top && r.top < area.bottom;
    document.querySelectorAll<HTMLElement>("[data-top-bar]").forEach((bar) => {
      const r = bar.getBoundingClientRect();
      if (onScreen(r) && r.top <= top + 1) top = Math.max(top, r.bottom);
    });
    document.querySelectorAll<HTMLElement>("[data-bottom-bar]").forEach((bar) => {
      const r = bar.getBoundingClientRect();
      if (onScreen(r) && r.bottom >= bottom - 1) bottom = Math.min(bottom, r.top);
    });
    const needed = box.bottom - (bottom - GAP); // how far the end of the section is below the fold
    const room = box.top - (top + GAP); // how far it can move before its top goes under the header
    const dy = Math.min(needed, room);
    if (dy <= 0) return;
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    (parent ?? window).scrollBy({ top: dy, behavior });
  });
}

// For a pull-down driven by React state: attach the ref to the whole section (its title row and what
// opens under it) and pass whether it's open.
export function useReveal<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false; // something that starts open (today's first hour) doesn't move the page
      return;
    }
    if (open) reveal(ref.current);
  }, [open]);
  return ref;
}
