"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Sparkles, UserRound } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Onboarding } from "./Onboarding";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/book", label: "Book", icon: Sparkles },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/membership", label: "Account", icon: UserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { member } = useStore();

  if (!member.onboarded) return <Onboarding />;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-sand">
      <header className="sticky top-0 z-20 border-b border-line bg-sand/95 px-4 py-3 backdrop-blur">
        <Link href="/" className="font-serif text-xl tracking-[0.35em] text-ink">
          ARTHA
        </Link>
      </header>
      <main className="flex-1 px-4 pb-20 pt-3">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-shell/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href} className={clsx("flex flex-col items-center gap-1 py-2.5 text-[11px]", active ? "text-moss" : "text-muted")}>
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
