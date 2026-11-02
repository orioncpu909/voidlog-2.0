"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { InPreview, gesture } from "@/lib/gesture";
import { dateKey } from "@/lib/schedule";

// Swipe left or right to move between the bottom tabs, like pages in a carousel: the next tab sits
// beside this one and comes in with the finger. Past the line (or on a quick flick) it finishes the
// slide and becomes the real page; short of the line it springs back.
// Off inside sideways-scrolling rows, form fields, sheets and full-screen pages, on pages that aren't
// tabs, and inside Book's categories, which have their own back arrow. The first and last tabs
// resist, and it's off while zoomed in or with two fingers down. Works with a finger, a mouse (click and drag) and a trackpad (two-finger swipe).
const EDGE = 20; // px at each side of the screen left to the phone's own back gesture
const LOCK = 10; // px of movement before a drag counts as sideways or up and down
const SIDEWAYS = 1.5; // how much more sideways than vertical a swipe has to be
const LINE = 0.25; // share of the screen to drag past
const FLICK = 0.5; // px per ms: a quick flick counts even short of the line
const MIN_FLICK = 40;
const EDGE_RESISTANCE = 0.3;
const SLIDE_MS = 160;
const WARM_MS = 150; // how long after the first tab opens the others get rendered
const HEADER_PX = 53;
const WHEEL_SETTLE_MS = 180;
const STUCK_MS = 3000; // bring the page back if a tab never loads

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// A rendered tab, kept out of the swipe's own updates: dragging only moves it, and it re-renders
// only when the app's data changes.
const TabPage = memo(function TabPage({ page: Page }: { page: ComponentType }) {
  return (
    <InPreview.Provider value>
      <Page />
    </InPreview.Provider>
  );
});

const sidewaysScroller = (start: EventTarget | null) => {
  for (let el = start instanceof Element ? start : null; el && el !== document.body; el = el.parentElement) {
    if (el.matches("input, textarea, select")) return true;
    if (el.scrollWidth > el.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return true;
  }
  return false;
};

export function SwipeTabs({
  tabs,
  pages,
  onLanding,
  children,
}: {
  tabs: string[];
  pages: Record<string, ComponentType>;
  onLanding: (href: string | null) => void; // where a finished swipe is headed, so the tab bar moves with it
  children: ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [animated, setAnimated] = useState(false);
  const pathRef = useRef(path);
  pathRef.current = path;
  const [paneTop, setPaneTop] = useState(0); // the tabs beside this one line up with the scrolled page
  const [warm, setWarm] = useState(false);
  const entering = useRef(false); // a swipe's page change is on its way
  const slideTimer = useRef<ReturnType<typeof setTimeout>>();
  const busy = useRef(false);
  const column = useRef<HTMLDivElement>(null); // the app is a centered column on wide screens
  const stuckTimer = useRef<ReturnType<typeof setTimeout>>();
  const [zoomed, setZoomed] = useState(false);

  // Zoomed in, a sideways drag moves around the page, so it can't also change tabs.
  useEffect(() => {
    const view = window.visualViewport;
    if (!view) return;
    const check = () => setZoomed(view.scale > 1.01);
    view.addEventListener("resize", check);
    return () => view.removeEventListener("resize", check);
  }, []);

  const index = tabs.indexOf(path);
  const previous = tabs[index - 1];
  const next = tabs[index + 1];
  useEffect(() => {
    if (index < 0) return;
    if (previous) router.prefetch(previous);
    if (next) router.prefetch(next);
  }, [index, previous, next, router]);

  // Keep every tab rendered beside the page, hidden until a swipe shows it, so the next tab is
  // already there under the finger and changing tabs only changes which one is showing.
  useEffect(() => {
    if (index < 0 || warm) return;
    const id = setTimeout(() => setWarm(true), WARM_MS);
    return () => clearTimeout(id);
  }, [index, warm]);

  // The swipe finished, or the page changed some other way: the real page takes over from the
  // preview in the same frame, exactly where the preview was.
  useIsoLayoutEffect(() => {
    clearTimeout(slideTimer.current);
    clearTimeout(stuckTimer.current);
    slideTimer.current = undefined;
    if (entering.current) window.scrollTo(0, 0);
    entering.current = false;
    busy.current = false;
    setAnimated(false);
    setOffset(0);
    setPaneTop(0);
    onLanding(null);
  }, [path, onLanding]);

  useEffect(() => {
    let start: { x: number; y: number; t: number } | null = null;
    let moved = 0;
    let suppressClick = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const neighbor = (dir: number) => {
      const i = tabs.indexOf(pathRef.current);
      return i < 0 ? undefined : tabs[i + dir];
    };
    const canSwipe = (target: EventTarget | null) =>
      !busy.current &&
      !(window.visualViewport && window.visualViewport.scale > 1.01) &&
      tabs.includes(pathRef.current) &&
      !(pathRef.current === "/book" && window.location.search) &&
      !document.querySelector("[role=dialog]") &&
      document.body.style.overflow !== "hidden" &&
      !sidewaysScroller(target);
    const width = () => column.current?.offsetWidth ?? window.innerWidth;
    const follow = (dx: number) => {
      moved = dx;
      setPaneTop(window.scrollY);
      setAnimated(false);
      setOffset(neighbor(dx < 0 ? 1 : -1) ? dx : dx * EDGE_RESISTANCE);
    };
    const settle = () => {
      setAnimated(true);
      setOffset(0);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setAnimated(false);
        setPaneTop(0); // hidden tabs mustn't hold the page tall
      }, SLIDE_MS);
    };
    const go = (dir: number) => {
      const href = neighbor(dir);
      if (!href) return settle();
      busy.current = true;
      onLanding(href);
      setAnimated(true);
      setOffset(-dir * width());
      clearTimeout(timer);
      slideTimer.current = setTimeout(() => {
        slideTimer.current = undefined;
        entering.current = true;
        router.push(href, { scroll: false });
        clearTimeout(stuckTimer.current);
        // A tab that never loaded: spring back. If it still lands later, it lands at its top.
        stuckTimer.current = setTimeout(() => {
          busy.current = false;
          onLanding(null);
          settle();
        }, STUCK_MS);
      }, SLIDE_MS);
    };
    const finish = (flicked: boolean) => {
      const dir = moved < 0 ? 1 : -1;
      if (neighbor(dir) && (Math.abs(moved) > width() * LINE || (flicked && Math.abs(moved) > MIN_FLICK))) go(dir);
      else settle();
    };

    const begin = (x: number, y: number, target: EventTarget | null) => {
      gesture.axis = null;
      moved = 0;
      start = canSwipe(target) ? { x, y, t: performance.now() } : null;
    };
    const move = (x: number, y: number, e: Event) => {
      if (!start) return;
      const dx = x - start.x;
      const dy = y - start.y;
      if (gesture.axis === null) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < LOCK) return;
        if (Math.abs(dx) <= Math.abs(dy) * SIDEWAYS || !e.cancelable) {
          gesture.axis = "y";
          start = null;
          return;
        }
        gesture.axis = "x";
        window.getSelection()?.removeAllRanges();
      }
      document.body.style.userSelect = "none";
      if (e.cancelable) e.preventDefault();
      follow(dx);
    };
    // Interrupted (a second finger, or the phone took over the touch): back to where it was.
    const cancel = () => {
      if (start && gesture.axis === "x") {
        document.body.style.userSelect = "";
        settle();
      }
      start = null;
      gesture.axis = null;
    };
    const end = (x: number) => {
      if (start && gesture.axis === "x") {
        document.body.style.userSelect = "";
        finish(Math.abs(x - start.x) / (performance.now() - start.t) > FLICK);
      }
      start = null;
      gesture.axis = null;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) return cancel();
      const x = e.touches[0].clientX;
      begin(x, e.touches[0].clientY, e.target);
      if (x < EDGE || x > window.innerWidth - EDGE) start = null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) return cancel();
      move(e.touches[0].clientX, e.touches[0].clientY, e);
    };
    const onTouchEnd = (e: TouchEvent) => end(e.changedTouches[0].clientX);
    const onMouseDown = (e: MouseEvent) => e.button === 0 && begin(e.clientX, e.clientY, e.target);
    const onMouseMove = (e: MouseEvent) => {
      if (start && e.buttons === 0) return onMouseUp(e); // the button was let go outside the window
      move(e.clientX, e.clientY, e);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (gesture.axis === "x") {
        // Swallow only the click this same release produces.
        suppressClick = true;
        setTimeout(() => (suppressClick = false), 0);
      }
      end(e.clientX);
    };
    const onClick = (e: MouseEvent) => {
      if (suppressClick) {
        e.stopPropagation();
        e.preventDefault();
        suppressClick = false;
      } else if (slideTimer.current && e.target instanceof Element && e.target.closest("a")) {
        // A tab or link tapped while the page was sliding out wins over the swipe.
        clearTimeout(slideTimer.current);
        slideTimer.current = undefined;
        busy.current = false;
        onLanding(null);
        settle();
      }
    };

    // Trackpad: a two-finger swipe, which ends once the scrolling stops. Past the line it goes right
    // away, without waiting for the momentum to die down; the rest of that swipe is then ignored.
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    let wheel: "swipe" | "ignore" | null = null;
    let wheelX = 0;
    const onWheel = (e: WheelEvent) => {
      if (wheel === null) {
        wheel = Math.abs(e.deltaX) > Math.abs(e.deltaY) * SIDEWAYS && canSwipe(e.target) ? "swipe" : "ignore";
        wheelX = 0;
        moved = 0;
        gesture.axis = wheel === "swipe" ? "x" : null;
      }
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        if (wheel === "swipe") finish(false);
        wheel = null;
        gesture.axis = null;
      }, WHEEL_SETTLE_MS);
      if (wheel !== "swipe") return;
      wheelX -= e.deltaX;
      follow(wheelX);
      if (Math.abs(moved) > width() * LINE) {
        wheel = "ignore";
        finish(false);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    window.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });
    window.addEventListener("touchend", onTouchEnd, true);
    window.addEventListener("touchcancel", cancel, true);
    window.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("mousemove", onMouseMove, true);
    window.addEventListener("mouseup", onMouseUp, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("wheel", onWheel, { capture: true, passive: true });
    return () => {
      clearTimeout(timer);
      clearTimeout(slideTimer.current);
      clearTimeout(stuckTimer.current);
      clearTimeout(wheelTimer);
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      window.removeEventListener("touchend", onTouchEnd, true);
      window.removeEventListener("touchcancel", cancel, true);
      window.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("mousemove", onMouseMove, true);
      window.removeEventListener("mouseup", onMouseUp, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("wheel", onWheel, true);
    };
  }, [tabs, router, onLanding]);

  const today = dateKey(new Date());

  // No transform at rest, so fixed pop-ups inside the page aren't affected.
  return (
    <div ref={column} className="flex flex-1 flex-col overflow-x-clip" style={{ touchAction: zoomed ? undefined : "pan-y pinch-zoom" }}>
      <div
        className="relative flex flex-1 flex-col"
        style={{ transform: offset ? `translateX(${offset}px)` : undefined, transition: animated ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : undefined }}
      >
        {children}
        {warm &&
          tabs.map((href, i) => {
            const Page = pages[href];
            if (!Page) return null;
            const beside = index >= 0 && Math.abs(i - index) === 1 && (offset !== 0 || animated);
            return (
              <div
                key={`${href}-${today}`} // a new day starts it fresh, so its calendar doesn't go stale
                aria-hidden
                {...({ inert: "" } as object)}
                className="pointer-events-none absolute left-0 w-full overflow-hidden px-4 pb-20 pt-3"
                style={{ top: paneTop, height: `calc(100dvh - ${HEADER_PX}px)`, transform: `translateX(${Math.sign(i - index) * 100}%)`, visibility: beside ? "visible" : "hidden" }}
              >
                <TabPage page={Page} />
              </div>
            );
          })}
      </div>
    </div>
  );
}
