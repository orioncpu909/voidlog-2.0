import { CREDIT_GROUPS, LocationId, PERK_LABEL, POLICY, SERVICES, ServiceId, Tier, priceFor } from "./data";
import { hoursUntil, momentLabel, money } from "./format";
import { sessionStart } from "./schedule";
import { eventAt, eventTicketPrice } from "./events";

export interface CancelTerms {
  deadline: Date; // last moment to cancel for free
  late: boolean;
  noShowCharge: number; // what a late cancel or no-show costs
  fee: number; // extra charge added on a late cancel
  refund: number; // goes back to the card on cancel
  creditBack: boolean;
  keep?: string; // what a free cancel keeps, e.g. "your treatment credit"
  // What happens if you cancel after the deadline or don't show up, in plain words.
  lateConsequence: string;
}

export interface BookingLike {
  serviceId: ServiceId;
  location: LocationId;
  date: string;
  time: string;
  price: number;
  usedCredit: boolean;
  perk?: boolean; // free as a monthly membership perk
}

export function canUseCredit(serviceId: ServiceId): boolean {
  const group = SERVICES[serviceId].group;
  return group !== "event" && CREDIT_GROUPS.includes(group);
}

// The no-show charge is what the service costs right now: the price paid if it was paid for,
// or its current listed price (specials included) if it came free with a membership. For a free
// member ticket to an event, that's the event's ticket price.
export function cancelTerms(tier: Tier, b: BookingLike, now = new Date()): CancelTerms {
  const windowHours = POLICY[SERVICES[b.serviceId].policy].windowHours;
  const start = sessionStart(b.date, b.time);
  const deadline = new Date(start.getTime() - windowHours * 36e5);
  const late = hoursUntil(start, now) < windowHours;
  const event = b.serviceId === "event" ? eventAt(b.location, b.date, b.time) : undefined;
  const listed = event ? eventTicketPrice(event, false) : priceFor("wellness", b.serviceId, b.location, b.date).price;

  let noShowCharge = 0;
  let fee = 0;
  let refund = 0;
  let lateConsequence: string;
  let keep: string | undefined;
  if (tier.id === "trial") {
    lateConsequence = "no charge during your trial.";
    refund = b.price;
  } else if (b.usedCredit) {
    keep = "your treatment credit";
    lateConsequence = "your treatment credit is used up.";
  } else if (b.perk) {
    // Like a credit: a late cancel uses up this month's perk, with no extra charge.
    keep = `this month's included ${PERK_LABEL[b.serviceId] ?? SERVICES[b.serviceId].name}`;
    lateConsequence = `${keep} is used up.`;
  } else if (b.price > 0) {
    noShowCharge = b.price;
    lateConsequence = `you're charged the ${money(b.price)} you paid (no refund).`;
  } else {
    noShowCharge = listed;
    fee = listed;
    lateConsequence = `you're charged ${money(listed)}, the service's current price.`;
  }

  if (!late) return { deadline, late, noShowCharge, fee: 0, refund: b.price, creditBack: b.usedCredit, keep, lateConsequence };
  return { deadline, late, noShowCharge, fee, refund, creditBack: false, keep, lateConsequence };
}

// The one sentence shown wherever a booking's cancellation terms appear.
export function policyLine(t: CancelTerms, usedCredit: boolean): string {
  if (t.late) return `This starts soon, so it's past the free-cancellation time. If you cancel or don't show up, ${t.lateConsequence}`;
  const by = momentLabel(t.deadline);
  if (t.noShowCharge > 0) return `To avoid a no-show charge of ${money(t.noShowCharge)}, cancel by ${by}.`;
  const keep = t.keep ?? (usedCredit ? "your treatment credit" : undefined);
  if (keep) return `To keep ${keep}, cancel by ${by}.`;
  return `If you can't make it, please cancel by ${by}. No charge during your trial.`;
}
