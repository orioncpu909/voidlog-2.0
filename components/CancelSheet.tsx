"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Booking, useStore } from "@/lib/store";
import { dayLabel, money, timeLabel } from "@/lib/format";
import { Button, Sheet } from "./Sheet";

export function CancelSheet({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const { termsForBooking, cancel } = useStore();
  const t = booking ? termsForBooking(booking) : null;

  return (
    <Sheet open={!!booking} onClose={onClose} title="Cancel this booking?">
      {booking && t && (
        <div className="space-y-5">
          <p className="text-sm">
            {booking.title} · {dayLabel(booking.date, "long")} at {timeLabel(booking.time)}
          </p>
          <div className={`flex gap-3 rounded-2xl p-4 text-sm ${t.late ? "bg-clay-soft text-clay" : "bg-moss-soft text-moss"}`}>
            {t.late ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
            <div className="space-y-1">
              {t.late ? (
                <>
                  <p className="font-medium">Free cancellation has passed.</p>
                  <p>If you cancel now, {t.lateConsequence}</p>
                </>
              ) : (
                <>
                  <p className="font-medium">This cancellation is free.</p>
                  {t.refund > 0 && <p>{money(t.refund)} goes back to your card.</p>}
                  {t.creditBack && <p>Your treatment credit comes back to your account.</p>}
                </>
              )}
              {t.late && t.refund > 0 && <p>{money(t.refund)} goes back to your card.</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Button
              variant={t.late ? "danger" : "primary"}
              onClick={() => {
                cancel(booking.id);
                onClose();
              }}
            >
              {t.late ? "Cancel anyway" : "Yes, cancel"}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Keep my booking
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
