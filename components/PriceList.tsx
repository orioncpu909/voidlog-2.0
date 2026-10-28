"use client";

import { LocationId, PriceGroup, ServiceId, TIERS, TierId, priceFor } from "@/lib/data";
import { dateKey } from "@/lib/schedule";
import { PriceTag } from "./PriceTag";

const ROWS: { group: PriceGroup; label: string; sample: ServiceId }[] = [
  { group: "class", label: "Classes", sample: "class" },
  { group: "cryo", label: "Cryo", sample: "cryo" },
  { group: "sauna", label: "Sauna", sample: "ir-sauna" },
  { group: "float", label: "Float", sample: "float" },
  { group: "contrast", label: "Contrast", sample: "contrast" },
  { group: "redlight", label: "Red Light", sample: "red-light" },
  { group: "hbot", label: "HBOT", sample: "hbot" },
  { group: "treatment", label: "Treatments", sample: "massage" },
];

// Two columns, so all eight prices fit in about half the height of a single list.
export function PriceList({ tier, location }: { tier: TierId; location: LocationId }) {
  const today = dateKey(new Date());
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
      {ROWS.map((r) => (
        <div key={r.group} className="flex items-center justify-between gap-2 bg-card px-3 py-2 text-sm">
          <span className="min-w-0">
            {r.label}
            {TIERS[tier].monthlyPerks?.[r.sample] && <span className="block text-[11px] leading-tight text-moss">1 free/mo, then</span>}
          </span>
          <PriceTag quote={priceFor(tier, r.sample, location, today)} />
        </div>
      ))}
    </div>
  );
}
