// Join-me invites: a Wellness Account that booked a sauna, contrast or class can invite a friend to
// come along. The friend pays, not the sender, at the price the sender paid for that time (a
// running special or first-visit price included), which the invite shows up front. For a sauna or contrast the friend
// shares the sender's room: two tickets sold, one room used, so the other rooms stay free to book.
// For a class the friend takes their own spot.
// The friend opens the link, creates a free Wellness Account if they don't have one (or picks an
// existing account), confirms the charge in a pop-up, and the booking shows for both of them with
// the time and, for a sauna or contrast, the room.
// CONFIRM: whether members can send these too, what happens to the friend's booking if the sender
// cancels (here it stays: they paid for it), and the real link format.
import { LocationId, ServiceId, SERVICES, priceFor } from "./data";
import { money } from "./format";

export const INVITE_SERVICES: ServiceId[] = ["ir-sauna", "contrast", "class"];
export const canInviteTo = (serviceId: ServiceId) => INVITE_SERVICES.includes(serviceId);

// Services where the friend joins the sender in one room instead of taking another one.
export const sharesRoom = (serviceId: ServiceId) => serviceId === "ir-sauna" || serviceId === "contrast";

// Which room: saunas are numbered 1 to the service's capacity at each studio.
export function roomLabel(serviceId: ServiceId, room: number): string {
  return serviceId === "contrast" ? `Contrast room ${room}` : `Sauna ${room}`;
}

// What the friend pays when the sender's own booking was free (a credit or perk): a Wellness
// Account's price for that service, studio and day, specials included.
export function invitePrice(serviceId: ServiceId, location: LocationId, date: string): number {
  return priceFor("wellness", serviceId, location, date).price;
}

export interface SessionInvite {
  id: string;
  fromId: string; // the sender's account ("" when the invite came from another phone)
  fromName: string; // first name, as the friend knows them
  bookingId: string; // the sender's booking
  sessionId: string;
  serviceId: ServiceId;
  location: LocationId;
  date: string;
  time: string;
  durationMin: number;
  title: string;
  instructor?: string;
  room?: number; // sauna or contrast: the room they'll share
  price: number; // what the friend is charged
  sentAt: string;
  acceptedBy?: string; // the friend's account
  acceptedName?: string;
  acceptedAt?: string;
}

// What the invite is for, as the friend reads it: the class's name, or the therapy.
export function inviteServiceName(inv: Pick<SessionInvite, "serviceId" | "title">): string {
  if (inv.serviceId === "class") return inv.title;
  return inv.serviceId === "contrast" ? "Contrast" : "Infrared Sauna";
}

// The line the link preview, the share message and the friend's first screen all lead with.
export function inviteHeadline(inv: Pick<SessionInvite, "serviceId" | "title" | "price">): string {
  return `You've been invited to ${inviteServiceName(inv)}, for ${money(inv.price)}`;
}

// The link carries the invite itself, so it also works on the friend's own phone (the demo has no
// server to look it up on). It points at the copy of the app it was made in (the hosted demo, or a
// local preview), through /invite, whose link preview reads the headline above.
const APP_ORIGIN = "https://artha-app-psi.vercel.app";
const origin = () => (typeof window !== "undefined" && window.location.origin.startsWith("http") ? window.location.origin : APP_ORIGIN);
type Carried = Omit<SessionInvite, "acceptedBy" | "acceptedName" | "acceptedAt">;

export function inviteLink(invite: SessionInvite): string {
  const carried: Carried = {
    id: invite.id,
    fromId: invite.fromId,
    fromName: invite.fromName,
    bookingId: invite.bookingId,
    sessionId: invite.sessionId,
    serviceId: invite.serviceId,
    location: invite.location,
    date: invite.date,
    time: invite.time,
    durationMin: invite.durationMin,
    title: invite.title,
    instructor: invite.instructor,
    room: invite.room,
    price: invite.price,
    sentAt: invite.sentAt,
  };
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(carried)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${origin()}/invite?i=${code}`;
}

export function readInviteCode(code: string): SessionInvite | null {
  try {
    const json = decodeURIComponent(escape(atob(code.replace(/-/g, "+").replace(/_/g, "/"))));
    const v = JSON.parse(json) as SessionInvite;
    if (!v.id || !SERVICES[v.serviceId] || !canInviteTo(v.serviceId) || typeof v.price !== "number") return null;
    return v;
  } catch {
    return null;
  }
}
