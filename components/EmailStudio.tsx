"use client";

import { useState } from "react";
import clsx from "clsx";
import { CheckCircle2, Mail, MapPin } from "lucide-react";
import { LOCATIONS, LocationId, TIERS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Button, Sheet } from "./Sheet";

// Email a studio without leaving the app. The pop-up always shows which studio the message goes
// to. Wellness Accounts can switch between studios; members (and trials) can only email their
// home studio, so the button doesn't appear for the other one. The demo has no server, so "Send"
// can't deliver mail: it confirms and offers "Open in my email app" (a prefilled mailto: link).
const TOPICS = ["Booking question", "Membership", "Feedback", "Something else"] as const;

export function EmailStudioButton({ location, className }: { location: LocationId; className?: string }) {
  const { member } = useStore();
  const [open, setOpen] = useState(false);
  if (TIERS[member.tier].lockedToHome && location !== member.home) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx("inline-flex items-center gap-1.5 rounded-full border border-sage px-3 py-1.5 text-xs font-medium hover:bg-sage", className)}
      >
        <Mail size={14} /> Email this studio
      </button>
      {open && <EmailStudioSheet initial={location} onClose={() => setOpen(false)} />}
    </>
  );
}

function EmailStudioSheet({ initial, onClose }: { initial: LocationId; onClose: () => void }) {
  const { member } = useStore();
  const homeOnly = TIERS[member.tier].lockedToHome;
  const [to, setTo] = useState<LocationId>(homeOnly ? member.home : initial);
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>(TOPICS[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  const studio = LOCATIONS[to];

  const messageError = message.trim().length >= 5 ? "" : "Write a short message.";
  const fullSubject = subject.trim() ? `${topic}: ${subject.trim()}` : topic;
  const body = `${message.trim()}\n\n${member.name}${member.phone ? ` · ${member.phone}` : ""}`;
  const mailto = `mailto:${studio.email}?subject=${encodeURIComponent(fullSubject)}&body=${encodeURIComponent(body)}`;

  const send = () => {
    setTried(true);
    if (messageError) return;
    setSent(true);
  };

  return (
    <Sheet open onClose={onClose} title={sent ? "Message ready" : "Email a studio"}>
      {/* Always visible: exactly which studio this goes to. */}
      <div className="rounded-2xl bg-ink p-4 text-sand">
        <p className="text-[10px] uppercase tracking-[0.3em] text-sage">To</p>
        <p className="mt-1 font-serif text-2xl leading-tight">{studio.name}</p>
        <p className="text-sm">{studio.email}</p>
        <p className="mt-1 flex items-center gap-1 text-xs">
          <MapPin size={12} /> {studio.address}
        </p>
      </div>

      {sent ? (
        <div className="mt-4 space-y-4 text-sm">
          <p className="flex items-start gap-2">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-moss" />
            <span>
              Your message to <span className="font-medium">{studio.name}</span> is ready. The studio will reply by email.
            </span>
          </p>
          <p className="rounded-2xl bg-sand p-3 text-xs text-muted">
            Demo app: there&apos;s no server yet, so nothing was sent from here. Tap &ldquo;Open in my email app&rdquo; to send it now, with everything filled in.
          </p>
          <div className="space-y-2">
            <a href={mailto} className="block w-full rounded-full bg-sage px-5 py-3 text-center text-sm font-medium text-ink hover:bg-sage/90">
              Open in my email app
            </a>
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4 text-sm">
          {homeOnly ? (
            <p className="text-xs text-muted">
              As a {TIERS[member.tier].name} member, you can email your home studio, {LOCATIONS[member.home].short}.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-1 rounded-full border border-line p-1" role="radiogroup" aria-label="Studio">
              {(Object.keys(LOCATIONS) as LocationId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={to === id}
                  onClick={() => setTo(id)}
                  className={clsx("rounded-full py-2", to === id ? "bg-sage font-medium text-ink" : "text-muted")}
                >
                  {LOCATIONS[id].short}
                </button>
              ))}
            </div>
          )}

          <div>
            <p className="mb-1.5 font-medium">Topic</p>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={clsx("rounded-full border px-3 py-1.5 text-xs", topic === t ? "border-shell bg-shell text-sand" : "border-line")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="font-medium">Subject (optional)</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-card px-3.5 py-3 text-base outline-none focus:border-shell" />
          </label>

          <label className="block">
            <span className="font-medium">Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className={clsx("mt-1 w-full rounded-xl border bg-card px-3.5 py-3 text-base outline-none focus:border-shell", tried && messageError ? "border-clay" : "border-line")}
            />
            {tried && messageError && <span className="mt-1 block text-xs text-clay">{messageError}</span>}
          </label>

          <div className="space-y-2">
            <Button onClick={send}>Send to {studio.short}</Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
