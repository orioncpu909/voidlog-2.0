"use client";

import { useState } from "react";
import { Check, Copy, Info, Share2, UserRoundPlus } from "lucide-react";
import { LOCATIONS, priceFor } from "@/lib/data";
import { dayLabel, money, timeLabel, timeRange } from "@/lib/format";
import { cardLabel } from "@/lib/card";
import { SessionInvite, canInviteTo, inviteHeadline, inviteLink, inviteServiceName, roomLabel } from "@/lib/invite";
import { Booking, useStore } from "@/lib/store";
import { Button, Sheet } from "./Sheet";
import { CardDeclinedPanel, CardForm } from "./CardOnFileRow";

// Join-me invites (rules in lib/invite.ts): the sender's side on a booking, and the friend's
// confirm-and-pay pop-up.

// Under a Wellness Account's upcoming sauna, contrast or class booking: invite a friend, or who's
// coming. A booking that was itself joined on an invite says whose it is.
export function JoinInviteRow({ booking: b }: { booking: Booking }) {
  const { member, inviteFor, inviteForBooking, createInvite } = useStore();
  const [invite, setInvite] = useState<SessionInvite | null>(null);
  const shared = inviteForBooking(b);
  const room = b.room ? roomLabel(b.serviceId, b.room) : null;

  // The friend's booking: whose invite it came from.
  if (b.inviteId && shared) {
    return <p className="text-muted">{room ? `${room} · ` : ""}Joining {shared.fromName}</p>;
  }
  const sent = inviteFor(b.id);
  if (sent?.acceptedBy) {
    return <p className="text-muted">{room ? `${room} · ` : ""}{sent.acceptedName} is joining you</p>;
  }
  // The room is already on the booking's line above.
  if (member.tier !== "wellness" || !canInviteTo(b.serviceId)) return null;
  return (
    <>
      <button
        onClick={() => setInvite(createInvite(b.id))}
        className="-mx-1 flex min-h-[36px] items-center gap-1 rounded-lg px-1 font-medium text-moss active:bg-line"
      >
        <UserRoundPlus size={13} /> {sent ? "Invite sent · send again" : "Invite a friend to join"}
      </button>
      <Sheet open={!!invite} onClose={() => setInvite(null)} title="Invite a friend">
        {invite && <SendInvite invite={invite} />}
      </Sheet>
    </>
  );
}

// What the sender sees before sharing: the time and exactly what the friend will be charged (and
// that it isn't the sender).
function SendInvite({ invite: inv }: { invite: SessionInvite }) {
  const [copied, setCopied] = useState(false);
  const link = inviteLink(inv);
  const regular = priceFor("wellness", inv.serviceId, inv.location, inv.date).regular;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The link is on screen to copy by hand.
    }
  };
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: inviteHeadline(inv),
          text: `${inviteHeadline(inv)}: ${dayLabel(inv.date)} at ${timeLabel(inv.time)}, ARTHA ${LOCATIONS[inv.location].short}. Join me:`,
          url: link,
        });
      } else await copy();
    } catch {
      // Closing the share sheet isn't an error.
    }
  };
  return (
    <div className="space-y-3 text-sm">
      <SessionSummary invite={inv} />
      <div className="flex items-baseline justify-between rounded-2xl border border-line px-4 py-3">
        <span>Your friend pays</span>
        <span className="text-right">
          <span className="stat-num text-2xl">{money(inv.price)}</span>
          {regular > inv.price && <span className="ml-1.5 text-xs text-muted line-through">{money(regular)}</span>}
        </span>
      </div>
      <p className="text-xs text-muted">
        It&apos;s charged to their card when they accept, not yours. They open your link, create a free Wellness Account if they don&apos;t have one, and confirm the amount before paying.
      </p>
      <button onClick={copy} aria-label="Copy your invite link" className="flex w-full items-center gap-2 rounded-2xl border border-line bg-sand px-3 py-2.5 text-left active:bg-line">
        <span className="min-w-0 flex-1 truncate">{link.replace("https://", "")}</span>
        <span className="flex shrink-0 items-center gap-1 font-medium text-moss">
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
        </span>
      </button>
      <Button onClick={share}>
        <span className="flex items-center justify-center gap-2">
          <Share2 size={16} /> Share invite
        </span>
      </Button>
    </div>
  );
}

function SessionSummary({ invite: inv }: { invite: SessionInvite }) {
  return (
    <div className="rounded-2xl bg-sand px-4 py-3">
      <p className="font-heading text-xl leading-tight">{inv.title}</p>
      <p className="mt-0.5">
        {dayLabel(inv.date, "long")} · {timeRange(inv.time, inv.durationMin)}
      </p>
      <p className="text-muted">
        ARTHA {LOCATIONS[inv.location].short}
        {inv.instructor ? ` · with ${inv.instructor.split(" ")[0]}` : ""}
      </p>
    </div>
  );
}

// The friend's side: shown once they're in an account (after creating one), over the app. It says
// who invited them and to what, then the amount they'll be charged, to confirm before paying.
export function AcceptInviteSheet() {
  const { member, pendingInvite, acceptInvite, dismissInvite, setCard } = useStore();
  const [done, setDone] = useState<SessionInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const inv = done ?? pendingInvite;
  if (!inv) return null;
  const close = () => {
    if (!done) dismissInvite();
    setDone(null);
    setError(null);
  };
  const confirm = () => {
    const res = acceptInvite();
    if (res.ok) {
      setDone(inv);
      setError(null);
    } else if (res.declined) setDeclined(true);
    else setError(res.error);
  };

  return (
    <Sheet open onClose={close} title={done ? "You're booked" : `${inv.fromName} invited you`}>
      {done ? (
        <div className="space-y-3 text-sm">
          <SessionSummary invite={inv} />
          <p>
            You and {inv.fromName} are both booked. {money(inv.price)} was charged to your card. It&apos;s in your Bookings tab.
          </p>
          <Button onClick={close}>Done</Button>
        </div>
      ) : declined ? (
        <CardDeclinedPanel onSaved={() => setDeclined(false)} onBack={() => setDeclined(false)} />
      ) : (
        <div className="space-y-3 text-sm">
          <p>
            {inv.fromName} invited you to {inviteServiceName(inv)}, for {money(inv.price)}.
          </p>
          <SessionSummary invite={inv} />
          <div className="rounded-2xl border border-line px-4 py-3">
            <p className="flex items-baseline justify-between">
              <span>You&apos;ll be charged</span>
              <span className="stat-num text-2xl">{money(inv.price)}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {member.card ? `To your ${cardLabel(member.card)}, when you confirm.` : "Add a card below. You're charged when you confirm."} {inv.fromName} isn&apos;t charged for you.
            </p>
          </div>
          {!member.card && inv.price > 0 ? (
            <CardForm onSave={(c) => setCard(c)} />
          ) : (
            <Button onClick={confirm}>Confirm and pay {money(inv.price)}</Button>
          )}
          {error && (
            <p role="alert" className="flex items-start gap-2 text-clay">
              <Info size={15} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}
          <Button variant="secondary" onClick={close}>
            Not now
          </Button>
        </div>
      )}
    </Sheet>
  );
}
