"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PriceGroup, ServiceId, TIERS, currentPromos, priceFor } from "@/lib/data";
import { dateKey } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { money, shortDate } from "@/lib/format";

export const PROMO_LABELS: Record<PriceGroup, { label: string; sample: ServiceId }> = {
  class: { label: "Classes", sample: "class" },
  cryo: { label: "Cryo", sample: "cryo" },
  sauna: { label: "Sauna", sample: "ir-sauna" },
  float: { label: "Float", sample: "float" },
  contrast: { label: "Contrast", sample: "contrast" },
  redlight: { label: "Red Light", sample: "red-light" },
  hbot: { label: "HBOT", sample: "hbot" },
  treatment: { label: "Treatments", sample: "massage" },
};

// The specials Wellness Accounts get right now. Sits under the user's name on Home.
export function PromoBanner() {
  const { member } = useStore();
  const today = dateKey(new Date());
  const promos = currentPromos(today);
  if (promos.length === 0 || TIERS[member.tier].isMember) return null;

  const items = promos.flatMap((p) =>
    (Object.keys(p.prices) as PriceGroup[]).map((g) => ({
      ...PROMO_LABELS[g],
      ends: p.ends,
      quote: priceFor(member.tier, PROMO_LABELS[g].sample, member.home, today),
    })),
  );

  return (
    <Link href="/book" className="relative block overflow-hidden rounded-3xl bg-sage p-5 text-shell shadow-sm">
      <Sparkles size={110} strokeWidth={1} className="pointer-events-none absolute -right-4 -top-4 opacity-15" aria-hidden />
      <p className="relative inline-flex items-center rounded-full bg-shell/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest">
        Wellness Account specials
      </p>
      <div className="relative mt-3 flex flex-wrap gap-x-7 gap-y-3">
        {items.map(({ label, quote, ends }) => (
          <div key={label}>
            <p className="text-xs opacity-80">{label}</p>
            <p className="flex items-baseline gap-1.5">
              <span className="font-serif text-4xl leading-none">{money(quote.price)}</span>
              <span className="text-sm line-through opacity-60">{money(quote.regular)}</span>
            </p>
            <p className="mt-0.5 text-[11px] opacity-80">until {shortDate(ends)}</p>
          </div>
        ))}
      </div>
      <p className="relative mt-3 text-sm opacity-90">At West LA and Studio City · Book now →</p>
    </Link>
  );
}
