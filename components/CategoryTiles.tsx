"use client";

import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Dumbbell, Flame, Hand } from "lucide-react";
import { CATEGORY_BLURB, CATEGORY_LABEL, Category, lowestPriceIn } from "@/lib/data";
import { dateKey } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { money } from "@/lib/format";
import { CATEGORY_IMAGE } from "@/lib/images";

// Each tile is a photo of the service with a tint in the tile's color, darkest on the text side.
const STYLE: Record<Category, { bg: string; tint: string; icon: typeof Dumbbell }> = {
  class: { bg: "bg-moss", tint: "from-moss/95 via-moss/75 to-moss/25", icon: Dumbbell },
  therapy: { bg: "bg-ocean", tint: "from-ocean/95 via-ocean/75 to-ocean/25", icon: Flame },
  treatment: { bg: "bg-walnut", tint: "from-walnut/95 via-walnut/75 to-walnut/25", icon: Hand },
  event: { bg: "bg-sage", tint: "from-sage/95 via-sage/75 to-sage/25", icon: Dumbbell }, // events are booked from Home, not from these tiles
};

// Big, colored entry points into booking. Used on Home and the first Book step.
// The first-visit discount only shows once someone is booking, not on Home.
export function CategoryTiles({ onPick, showFirstVisit = false }: { onPick?: (c: Category) => void; showFirstVisit?: boolean }) {
  const { member, firstVisitEligible } = useStore();
  const today = dateKey(new Date());

  return (
    <div className="space-y-3">
      {(["class", "therapy", "treatment"] as Category[]).map((c) => {
        const { bg, tint, icon: Icon } = STYLE[c];
        const image = CATEGORY_IMAGE[c];
        const from = lowestPriceIn(member.tier, c, member.home, today, showFirstVisit && firstVisitEligible);
        const body = (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.src} alt="" aria-hidden loading="lazy" className="pointer-events-none absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <span className={clsx("pointer-events-none absolute inset-0 bg-gradient-to-r", tint)} aria-hidden />
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
            {/* Therapies vary in price, so that tile shows no single price. */}
            {from && c !== "therapy" && (
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
        const className = clsx("group relative block min-h-[140px] w-full overflow-hidden rounded-3xl p-5 text-left text-shell shadow-sm transition hover:shadow-md active:scale-[0.99]", bg);
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
