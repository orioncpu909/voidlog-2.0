// Guest passes: a paying member (Restore, Classic or Gold) can send friends a pass for a day at
// ARTHA, up to GUEST_PASSES_PER_MONTH each calendar month. Unused ones don't roll over. A pass counts
// when it's sent, and cancelling one that hasn't been claimed gives it back. The friend gets an
// email with a link to book the three services at the member's home studio only, and booking the
// first one claims the pass. ARTHA
// doesn't allow recurring guests, so an email address can only ever claim one, from any member. A
// pass still waiting ends with the member's membership, which frees that address.
// CONFIRM: passes never expire, and the real link format (artha.la doesn't read ?pass= yet).
import { LOCATIONS, LocationId, ServiceId } from "./data";
import { cleanEmail } from "./validate";

export const GUEST_PASSES_PER_MONTH = 8;
export const GUEST_SERVICES: { id: ServiceId; label: string }[] = [
  { id: "class", label: "class" },
  { id: "ir-sauna", label: "sauna" },
  { id: "cryo", label: "cryotherapy" },
];
export const GUEST_PASS_INCLUDES = GUEST_SERVICES.map((s) => `1 ${s.label}`);

export interface GuestPass {
  id: string;
  code: string;
  senderId: string;
  senderName: string; // first name, as the friend knows them
  location: LocationId; // the sender's home studio, the only place the pass works
  name: string;
  email: string;
  sentAt: string; // ISO
  claimedAt?: string; // ISO, when the first service was booked
}

// Bookings on a pass sit with everyone else's, so they take up real spots.
export const guestBookerId = (p: Pick<GuestPass, "id">) => `guest:${p.id}`;

// The same inbox, however it's typed: no capitals, no +tags, and Gmail ignores dots.
export function emailKey(email: string): string {
  const [user, domain] = cleanEmail(email).split("@");
  const gmail = domain === "gmail.com" || domain === "googlemail.com";
  const base = user.split("+")[0];
  return gmail ? `${base.replace(/\./g, "")}@gmail.com` : `${base}@${domain}`;
}

const sameMonth = (iso: string, now: Date) => {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

export const passesSentThisMonth = (memberId: string, passes: GuestPass[], now = new Date()) => passes.filter((p) => p.senderId === memberId && sameMonth(p.sentAt, now));
export const passesLeft = (memberId: string, passes: GuestPass[], now = new Date()) => Math.max(0, GUEST_PASSES_PER_MONTH - passesSentThisMonth(memberId, passes, now).length);

// What a member sees: everything still waiting, from any month, plus what was claimed this month.
export const passesToShow = (memberId: string, passes: GuestPass[], now = new Date()) =>
  passes.filter((p) => p.senderId === memberId && (!p.claimedAt || sameMonth(p.claimedAt, now))).reverse();

// Why this friend can't get a pass, if they can't. A pass waiting for them blocks a second one.
export function guestPassBlock(email: string, passes: GuestPass[]): string | null {
  const key = emailKey(email);
  const theirs = passes.filter((p) => p.email && emailKey(p.email) === key);
  if (theirs.some((p) => p.claimedAt)) return "This friend has already claimed a guest pass. Each guest can only claim one, once.";
  if (theirs.length) return "This friend already has a guest pass waiting to be claimed.";
  return null;
}

export const guestPassLink = (p: Pick<GuestPass, "code">) => `https://artha.la/guest?pass=${p.code}`;

// What the friend gets by email.
export const guestPassEmail = (p: Pick<GuestPass, "name" | "senderName" | "location">) => ({
  subject: `${p.senderName} sent you a day at ARTHA`,
  body: `Hi ${p.name.split(" ")[0]}, ${p.senderName} sent you a guest pass to experience ARTHA: ${GUEST_PASS_INCLUDES.slice(0, -1).join(", ")} and ${GUEST_PASS_INCLUDES[GUEST_PASS_INCLUDES.length - 1]}, all complimentary, at ${LOCATIONS[p.location].name}. Guest passes are one per person and only work at this location.`,
});
