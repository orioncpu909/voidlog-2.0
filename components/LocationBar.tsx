"use client";

import clsx from "clsx";
import { Lock, MapPin } from "lucide-react";
import { LOCATIONS, LocationId, TIERS } from "@/lib/data";
import { useStore } from "@/lib/store";

export function LocationBar({ showHint = false }: { showHint?: boolean }) {
  const { member, setLocation } = useStore();

  if (TIERS[member.tier].lockedToHome) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-muted">
        <MapPin size={15} />
        <span className="text-ink">{LOCATIONS[member.home].short}</span>
        <Lock size={12} className="ml-1" />
        <span className="text-xs">your membership location</span>
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1 rounded-full border border-line bg-shell p-1 text-sm" role="radiogroup" aria-label="Location">
        {(Object.keys(LOCATIONS) as LocationId[]).map((id) => (
          <button
            key={id}
            role="radio"
            aria-checked={member.home === id}
            onClick={() => setLocation(id)}
            className={clsx("flex items-center justify-center gap-1.5 rounded-full py-2", member.home === id ? "bg-moss text-shell" : "text-muted hover:text-ink")}
          >
            <MapPin size={14} />
            {LOCATIONS[id].short}
          </button>
        ))}
      </div>
      {showHint && <p className="text-center text-xs text-muted">Your Wellness Account works at both locations. Tap to switch.</p>}
    </div>
  );
}
