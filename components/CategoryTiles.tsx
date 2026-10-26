"use client";

import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Dumbbell, Flame, Hand } from "lucide-react";
import { CATEGORY_BLURB, CATEGORY_LABEL, Category, lowestPriceIn } from "@/lib/data";
import { dateKey } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { money } from "@/lib/format";

const STYLE: Record<Category, { bg: string; icon: typeof Dumbbell }> = {
  class: { bg: "bg-moss", icon: Dumbbell },
  therapy: { bg: "bg-ocean", icon: Flame },
  treatment: { bg: "bg-walnut", icon: Hand },
  event: { bg: "bg-sage", icon: Dumbbell }, // events are booked from Home, not from these tiles
};

// Big, colored entry points into booking. Used on Home and the first Book step.
// The first-visit discount only shows once someone is booking, not on Home.
export function CategoryTiles({ onPick, showFirstVisit = false }: { onPick?: (c: Category) => void; showFirstVisit?: boolean }) {
  const { member, firstVisitEligible } = useStore();
  const today = dateKey(new Date());

  return (
    <div className="space-y-3">
      {(["class", "therapy", "treatment"] as Category[]).map((c) => {
        const { bg, icon: Icon } = STYLE[c];
        const from = lowestPriceIn(member.tier, c, member.home, today, showFirstVisit && firstVisitEligible);
        const body = (
          <>
            <Icon size={120} strokeWidth={1} className="pointer-events-none absolute -bottom-6 -right-4 opacity-10" aria-hidden />
            <div className="relative flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-shell/15">
                <Icon size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-3xl leading-none">{CATEGORY_LABEL[c]}</p>
                <p className="mt-1 text-xs opacity-75">{CATEGORY_BLURB[c]}</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-shell text-ink transition group-hover:translate-x-0.5">
                <ArrowRight size={18} />
              </span>
            </div>
            {from && (
              <div className="relative mt-4 inline-flex items-baseline gap-1.5 rounded-full bg-shell/15 px-3 py-1 text-sm">
                {from.kind === "included" ? (
                  "Included with your membership"
                ) : (
                  <>
                    {c !== "class" && <span className="opacity-75">From</span>}
                    {(from.kind === "promo" || from.kind === "firstVisit") && <span className="text-xs line-through opacity-60">{money(from.regular)}</span>}
                    <span className="font-semibold">{money(from.price)}</span>
                    {from.kind === "promo" && <span className="text-xs opacity-75">special</span>}
                    {from.kind === "firstVisit" && <span className="text-xs opacity-75">first visit</span>}
                  </>
                )}
              </div>
            )}
          </>
        );
        const className = clsx("group relative block w-full overflow-hidden rounded-3xl p-5 text-left text-shell shadow-sm transition hover:shadow-md active:scale-[0.99]", bg);
        return onPick ? (
          <button key={c} onClick={() => onPick(c)} className={className}>
            {body}
          </button>
        ) : (
          <Link key={c} href={`/book?category=${c}`} className={className}>
            {body}
          </Link>
        );
      })}
    </div>
  );
}
