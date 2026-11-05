"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, QrCode, Sparkles, Trophy, UserRound } from "lucide-react";
import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "./Avatar";
import { Onboarding } from "./Onboarding";
import { SignUp } from "./SignUp";
import { PullToRefresh } from "./PullToRefresh";
import { SwipeTabs } from "./SwipeTabs";
import { SHOW_CALENDAR_TAB, SHOW_COMMUNITY } from "@/lib/flags";
import HomePage from "@/app/page";
import BookPage from "@/app/book/page";
import CommunityPage from "@/app/community/page";
import AccountPage from "@/app/membership/page";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/book", label: "Book", icon: Sparkles },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/community", label: "Community", icon: Trophy },
  { href: "/membership", label: "Account", icon: UserRound },
].filter((t) => (SHOW_CALENDAR_TAB || t.href !== "/calendar") && (SHOW_COMMUNITY || t.href !== "/community"));
const TAB_HREFS = TABS.map((t) => t.href);
const TAB_PAGES = { "/": HomePage, "/book": BookPage, "/community": CommunityPage, "/membership": AccountPage };

const CheckInSheet = dynamic(() => import("./CheckInSheet").then((m) => m.CheckInSheet), { ssr: false });

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { member } = useStore();
  const [landing, setLanding] = useState<string | null>(null); // a swipe's destination, while it finishes
  const [checkingIn, setCheckingIn] = useState(false);
  const current = landing ?? path;
  const isActive = (href: string) => (href === "/" ? current === "/" : current.startsWith(href));
  const activeTab = TABS.findIndex((t) => isActive(t.href));

  // A guest's page: they have no account, so no sign-up and no tabs. The staff admin isn't part of
  // the member app either.
  if (path === "/guest" || path === "/admin") return <>{children}</>;

  // A fresh download creates an account first, then sees the welcome walkthrough.
  if (member.signedUp === false) return <SignUp />;
  if (!member.onboarded) return <Onboarding />;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-sand text-shell">
      <header data-top-bar className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-sand px-4 py-3">
        <Link href="/" className="font-wordmark text-xl tracking-[0.35em]">
          ARTHA
        </Link>
        <div className="flex items-center gap-3">
          {/* Your check-in code, from every tab. */}
          <button onClick={() => setCheckingIn(true)} aria-label="Check in" className="-my-1 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card active:bg-line">
            <QrCode size={18} />
          </button>
          {/* Your profile, from every tab. */}
          <Link
            href="/profile"
            aria-label="Your profile"
            className={clsx("-my-1 rounded-full", path === "/profile" && "ring-2 ring-sage ring-offset-2 ring-offset-sand")}
          >
            <Avatar name={member.name} photo={member.photo} className="h-8 w-8 text-base" />
          </Link>
        </div>
      </header>
      {checkingIn && <CheckInSheet onClose={() => setCheckingIn(false)} />}
      <PullToRefresh>
        <SwipeTabs tabs={TAB_HREFS} pages={TAB_PAGES} onLanding={setLanding}>
          <main className="flex-1 px-4 pb-20 pt-3">{children}</main>
        </SwipeTabs>
      </PullToRefresh>
      <nav data-bottom-bar className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-sand">
        <div className={clsx("relative mx-auto grid max-w-md", TABS.length === 5 ? "grid-cols-5" : TABS.length === 4 ? "grid-cols-4" : "grid-cols-3")}>
          {/* The soft highlight behind the current tab, which glides from tab to tab. */}
          {activeTab >= 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 p-1 transition-transform duration-200 ease-out"
              style={{ width: `${100 / TABS.length}%`, transform: `translateX(${activeTab * 100}%)` }}
            >
              <span className="block h-full rounded-2xl bg-shell/10" />
            </span>
          )}
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} className={clsx("relative flex flex-col items-center gap-1 py-2.5 text-[11px]", active ? "font-medium text-shell" : "text-muted")}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
