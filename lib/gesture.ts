import { createContext } from "react";

// Which way the current drag is going, shared so a sideways tab swipe and a pull up or down never
// run at once. SwipeTabs sets it; PullToRefresh stands down when it's "x".
export const gesture: { axis: "x" | "y" | null } = { axis: null };

// Inside a list with its own scrollbar that can still scroll that way (1 is down, -1 is up), the
// drag belongs to the list, not the page.
// True inside the hidden copy of a tab kept beside the page, which mustn't act on the page's URL.
export const InPreview = createContext(false);

export function canScrollY(start: EventTarget | null, dir: 1 | -1) {
  for (let el = start instanceof Element ? start : null; el && el !== document.body; el = el.parentElement) {
    if (el.scrollHeight <= el.clientHeight + 1 || !/auto|scroll/.test(getComputedStyle(el).overflowY)) continue;
    if (dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return true;
  }
  return false;
}
