"use client";

import { useState } from "react";
import clsx from "clsx";
import { Activity, Check, Footprints, HeartPulse, Watch } from "lucide-react";
import { PROVIDERS, Provider, ProviderId, stepSource } from "@/lib/devices";
import { useStore } from "@/lib/store";
import { Button, Sheet } from "./Sheet";

const ICONS: Record<ProviderId, typeof Activity> = {
  "apple-health": HeartPulse,
  garmin: Watch,
  whoop: Activity,
  strava: Footprints,
};

// Account → Connected apps: link a fitness app so steps show up in Stats.
export function ConnectedApps() {
  const { member, connectApp, disconnectApp } = useStore();
  const [pending, setPending] = useState<Provider | null>(null);
  const connected = member.connections ?? [];
  const source = stepSource(connected);

  return (
    <section id="connected-apps" className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl">Connected apps</h2>
        {source && <span className="text-xs text-muted">Steps from {source.name}</span>}
      </div>
      <p className="text-xs text-muted">Connect one to track your steps alongside your visits.</p>
      <div className="divide-y divide-line rounded-2xl border border-line bg-shell">
        {PROVIDERS.map((p) => {
          const Icon = ICONS[p.id];
          const on = connected.includes(p.id);
          return (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", on ? "bg-moss text-shell" : "bg-sand text-moss")}>
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted">{p.shares}</p>
              </div>
              {on ? (
                <button onClick={() => disconnectApp(p.id)} className="flex items-center gap-1 rounded-full bg-moss-soft px-3 py-1 text-xs text-moss" aria-label={`Disconnect ${p.name}`}>
                  <Check size={12} /> Connected
                </button>
              ) : (
                <button onClick={() => setPending(p)} className="rounded-full border border-line px-3 py-1 text-xs hover:border-moss">
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted">Demo: connections and step counts are simulated. Tap Connected to disconnect.</p>

      <Sheet open={!!pending} onClose={() => setPending(null)} title={pending ? `Connect ${pending.name}?` : ""}>
        {pending && (
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-line p-4">
              <p className="text-xs uppercase tracking-widest text-muted">ARTHA will read</p>
              <p className="mt-1 font-medium">{pending.shares}</p>
            </div>
            <ul className="space-y-1.5 text-muted">
              <li>• Read-only. ARTHA never adds or changes anything in {pending.name}.</li>
              <li>• Used only for your stats in this app.</li>
              <li>• Disconnect anytime from this page.</li>
            </ul>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  connectApp(pending.id);
                  setPending(null);
                }}
              >
                Connect {pending.name}
              </Button>
              <Button variant="secondary" onClick={() => setPending(null)}>
                Not now
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </section>
  );
}
