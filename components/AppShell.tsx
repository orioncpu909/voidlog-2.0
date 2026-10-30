"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Sparkles, Trophy, UserRound } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Onboarding } from "./Onboarding";
import { SignUp } from "./SignUp";
import { PullToRefresh } from "./PullToRefresh";
import { SHOW_CALENDAR_TAB } from "@/lib/flags";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/book", label: "Book", icon: Sparkles },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/community", label: "Community", icon: Trophy },
  { href: "/membership", label: "Account", icon: UserRound },
].filter((t) => SHOW_CALENDAR_TAB || t.href !== "/calendar");

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { member } = useStore();

  // A fresh download creates an account first, then sees the welcome walkthrough.
  if (member.signedUp === false) return <SignUp />;
  if (!member.onboarded) return <Onboarding />;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-sand text-shell">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-sand/95 px-4 py-3 backdrop-blur">
        <Link href="/" className="font-serif text-xl tracking-[0.35em]">
          ARTHA
        </Link>
        {/* Your profile, from every tab. */}
        <Link
          href="/profile"
          aria-label="Your profile"
          className={clsx(
            "-my-1 flex h-8 w-8 items-center justify-center rounded-full bg-shell font-serif text-base text-sage",
            path === "/profile" && "ring-2 ring-sage ring-offset-2 ring-offset-sand",
          )}
        >
          {member.name.slice(0, 1).toUpperCase()}
        </Link>
      </header>
      <PullToRefresh>
        <main className="flex-1 px-4 pb-20 pt-3">{children}</main>
      </PullToRefresh>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-sand/95 backdrop-blur">
        <div className={clsx("mx-auto grid max-w-md", TABS.length === 5 ? "grid-cols-5" : TABS.length === 4 ? "grid-cols-4" : "grid-cols-3")}>
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href} className={clsx("flex flex-col items-center gap-1 py-2.5 text-[11px]", active ? "font-medium text-shell" : "text-muted")}>
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
