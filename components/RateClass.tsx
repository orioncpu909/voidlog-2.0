"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Star, X } from "lucide-react";
import { LOCATIONS } from "@/lib/data";
import { dayLabel, timeLabel } from "@/lib/format";
import { COMMENT_MAX, COMMENT_MIN, STARS, commentOk, needsComment } from "@/lib/ratings";
import { Booking, useStore } from "@/lib/store";

// The 1 to 5 star question after a class or ticketed event (rules in lib/ratings.ts). Tapping stars
// only picks them; nothing saves until the member taps Send rating, then it says thanks. 3 or fewer
// also opens a comment box: the member has to say why before it sends. Members and guests never see ratings back; only staff do (app/admin), and without names:
// every rating is anonymous and every comment private, and the card says so.
// `details` adds the class's day, time and studio, for where the card doesn't already show them.
export function RateClass({
  booking,
  onRate,
  onSkip,
  details = true,
}: {
  booking: Booking;
  onRate: (stars: number, comment?: string) => void;
  onSkip?: () => void;
  details?: boolean;
}) {
  const [picked, setPicked] = useState(0); // the stars chosen, waiting for Send (and a comment if low)
  const [comment, setComment] = useState("");
  const [tried, setTried] = useState(false);
  const saved = booking.rating ?? 0;
  const stars = saved || picked;
  const who = booking.instructor ? ` with ${booking.instructor.split(" ")[0]}` : "";
  const low = needsComment(picked);
  const short = low && !commentOk(comment);
  return (
    <section className="rounded-2xl bg-card px-4 pb-2 pt-3" aria-live="polite">
      {saved ? (
        <div className="pb-1.5">
          <p className="text-sm font-medium">Thanks for rating {booking.title}</p>
          <p className="text-xs text-muted">
            All reviews are anonymous{booking.ratingComment ? " and comments are private" : ""}. Only the ARTHA team sees them, never who gave them.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              How was {booking.title}
              {who}?
            </p>
            {details && (
              <p className="text-xs text-muted">
                {dayLabel(booking.date)} · {timeLabel(booking.time)} · {LOCATIONS[booking.location].short}
              </p>
            )}
          </div>
          {onSkip && (
            <button onClick={onSkip} aria-label="Not now" className="-mr-3 -mt-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-line">
              <X size={16} />
            </button>
          )}
        </div>
      )}
      {!saved && <p className="text-[11px] text-muted">All reviews are anonymous.</p>}
      <div className="-ml-2 flex" role={saved ? undefined : "radiogroup"} aria-label={saved ? `Rated ${saved} out of 5` : `Rate this ${booking.serviceId === "event" ? "event" : "class"} from 1 to 5 stars`}>
        {STARS.map((n) => (
          <button
            key={n}
            onClick={() => setPicked(n)}
            disabled={!!saved}
            role={saved ? undefined : "radio"}
            aria-checked={saved ? undefined : picked === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className="flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-90 disabled:active:scale-100"
          >
            <Star size={28} strokeWidth={1.5} className={clsx(n <= stars ? "fill-sage text-sage" : "text-muted")} />
          </button>
        ))}
      </div>
      {!saved && picked > 0 && (
        <form
          className="space-y-2 pb-2 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            setTried(true);
            if (!short) onRate(picked, low ? comment : undefined);
          }}
        >
          {low && (
            <label className="block">
              <span className="text-sm font-medium">What could have been better?</span>
              <span className="block text-xs text-muted">
                Your feedback helps us improve the ARTHA experience. All comments are private: only the ARTHA team reads them, without your name.
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
                rows={3}
                autoFocus
                aria-invalid={tried && short}
                placeholder="Tell us what happened"
                className={clsx("mt-1.5 w-full resize-none rounded-xl border bg-card px-3 py-2.5 text-base outline-none focus:border-shell", tried && short ? "border-clay" : "border-line")}
              />
              {tried && short && <span className="block text-xs text-clay">Please write a few words (at least {COMMENT_MIN} characters).</span>}
            </label>
          )}
          <button type="submit" className="min-h-[44px] w-full rounded-full bg-sage px-4 text-sm font-medium text-ink active:bg-sage-light">
            Send rating
          </button>
        </form>
      )}
    </section>
  );
}

// On Home: the member's last class or event, if it's waiting for a rating. After Send it stays a few
// seconds to say thanks, then goes away.
export function RateLastClass() {
  const { ratingDue, allBookings, rateClass, skipRating } = useStore();
  const [thanked, setThanked] = useState<string | null>(null);
  useEffect(() => {
    if (!thanked) return;
    const t = setTimeout(() => setThanked(null), 3000);
    return () => clearTimeout(t);
  }, [thanked]);
  const booking = ratingDue ?? allBookings.find((b) => b.id === thanked);
  if (!booking) return null;
  return (
    <RateClass
      booking={booking}
      onRate={(stars, comment) => {
        rateClass(booking.id, stars, undefined, comment);
        setThanked(booking.id);
      }}
      onSkip={() => skipRating(booking.id)}
    />
  );
}
