"use client";

import { LocationId, PriceGroup, ServiceId, TierId, priceFor } from "@/lib/data";
import { dateKey } from "@/lib/schedule";
import { PriceTag } from "./PriceTag";

const ROWS: { group: PriceGroup; label: string; sample: ServiceId }[] = [
  { group: "class", label: "Classes", sample: "class" },
  { group: "cryo", label: "Cryo", sample: "cryo" },
  { group: "sauna", label: "Infrared Sauna", sample: "ir-sauna" },
  { group: "float", label: "Float", sample: "float" },
  { group: "contrast", label: "Contrast", sample: "contrast" },
  { group: "redlight", label: "Red Light", sample: "red-light" },
  { group: "hbot", label: "Hyperbaric Oxygen", sample: "hbot" },
  { group: "treatment", label: "Treatments (massage and more)", sample: "massage" },
];

export function PriceList({ tier, location }: { tier: TierId; location: LocationId }) {
  const today = dateKey(new Date());
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-card">
      {ROWS.map((r) => (
        <div key={r.group} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
          <span>{r.label}</span>
          <PriceTag quote={priceFor(tier, r.sample, location, today)} />
        </div>
      ))}
    </div>
  );
}
