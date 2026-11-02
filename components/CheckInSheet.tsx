"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import qrcode from "qrcode-generator";
import { LOCATIONS } from "@/lib/data";
import { checkInCode, checkInDue, checkInOpen, checkInPayload } from "@/lib/checkin";
import { dayLabel, timeLabel } from "@/lib/format";
import { sessionStart } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { Sheet } from "./Sheet";

const QUIET_ZONE = 4; // the blank margin scanners need, in QR squares

function QrCode({ text }: { text: string }) {
  const { size, path } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    let d = "";
    for (let y = 0; y < count; y++) for (let x = 0; x < count; x++) if (qr.isDark(y, x)) d += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`;
    return { size: count + QUIET_ZONE * 2, path: d };
  }, [text]);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Your check-in QR code" shapeRendering="crispEdges" className="mx-auto w-full max-w-[260px] rounded-2xl bg-white">
      <path d={path} fill="#000" />
    </svg>
  );
}

// Your code for the studio's scanner, black on white whatever the app's theme, since scanners need that.
export function CheckInSheet({ onClose }: { onClose: () => void }) {
  const { member, bookings, checkIn } = useStore();
  const code = checkInCode(member);
  const now = Date.now();
  const due = checkInDue(bookings);
  const alreadyIn = !due ? checkInOpen(bookings).at(-1) : undefined;
  const next = bookings
    .filter((b) => b.status === "booked" && sessionStart(b.date, b.time).getTime() > now)
    .sort((a, b) => sessionStart(a.date, a.time).getTime() - sessionStart(b.date, b.time).getTime())[0];
  const [done, setDone] = useState<string | null>(null);
  const [nothingDue, setNothingDue] = useState(false);
  const shown = due ?? next;

  return (
    <Sheet open onClose={onClose} title="Check in">
      <div className="space-y-3 text-center text-sm">
        <p className="text-shell">Scan this at the check-in scanner when you arrive.</p>
        <QrCode text={checkInPayload(code)} />
        <p className="stat-num text-lg tracking-widest">{code}</p>
        {done || alreadyIn ? (
          <p className="flex items-center justify-center gap-1.5 font-medium text-moss">
            <CheckCircle2 size={16} /> Checked in for {done ?? alreadyIn?.title}
          </p>
        ) : shown ? (
          <p className="text-muted">
            {due ? "Ready to check in" : "Next up"}: {shown.title}, {dayLabel(shown.date)} {timeLabel(shown.time)} at {LOCATIONS[shown.location].short}
          </p>
        ) : (
          <p className="text-muted">No appointments coming up.</p>
        )}
        <button
          onClick={() => {
            const b = checkIn();
            setNothingDue(!b);
            if (b) setDone(b.title);
          }}
          className="text-xs text-muted underline underline-offset-2"
        >
          Simulate the scan (demo)
        </button>
        {nothingDue && !alreadyIn && <p className="text-xs text-muted">Check-in opens 1 hour before an appointment.</p>}
      </div>
    </Sheet>
  );
}
