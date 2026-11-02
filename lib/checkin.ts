// Check-in: every account has its own QR code, scanned at the studio's check-in scanner. The scan
// finds the account from the code and checks in its appointment, any time from an hour before it
// starts until it ends.
// CONFIRM: the opening time. With a backend the code should be a short-lived signed token, since
// anyone with a screenshot of a fixed code could check in as this account.
import type { Booking, Member } from "./store";
import { sessionStart } from "./schedule";

export const CHECK_IN_EARLY_MIN = 60; // opens this long before the start

const hash = (text: string, seed: number) => {
  let h = seed;
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h.toString(36).toUpperCase().padStart(4, "0").slice(-4);
};

// The same code every time for an account, shown under the QR as a backup if a scan doesn't read.
export function checkInCode(member: Pick<Member, "id" | "email">): string {
  const key = `${member.id}|${member.email ?? ""}`;
  return `${hash(key, 7)}-${hash(key, 131)}`;
}

export const checkInPayload = (code: string) => `ARTHA-CHECKIN:${code}`;

// The account's appointments open for check-in right now, soonest first.
export function checkInOpen(bookings: Booking[], now = new Date()): Booking[] {
  return bookings
    .filter((b) => {
      const start = sessionStart(b.date, b.time).getTime();
      return b.status === "booked" && now.getTime() >= start - CHECK_IN_EARLY_MIN * 60000 && now.getTime() < start + b.durationMin * 60000;
    })
    .sort((a, b) => sessionStart(a.date, a.time).getTime() - sessionStart(b.date, b.time).getTime());
}

export const checkInDue = (bookings: Booking[], now = new Date()) => checkInOpen(bookings, now).find((b) => !b.checkedInAt);
