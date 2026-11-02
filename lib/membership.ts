// Cancelling a paid membership (Restore, Classic, Gold):
// - Within the first 5 days: full refund, and the membership ends right away. Restore and Gold lose
//   this once a treatment credit is used.
// - After that: no refund. Nothing more is charged, and the member keeps full access, prices
//   and their calendar until the end of the month. Then the account becomes a free Wellness Account.

import { SERVICES, ServiceId, TIERS, TierId } from "./data";

export const REFUND_WINDOW_DAYS = 5;

export function inRefundWindow(memberSince: string | undefined, now = new Date()): boolean {
  return !!memberSince && now.getTime() - new Date(memberSince).getTime() < REFUND_WINDOW_DAYS * 864e5;
}

// Restore's monthly massage counts as its treatment credit. A booking cancelled in time gives it back.
export function usesTreatmentCredit(b: { usedCredit: boolean; perk?: boolean; serviceId: ServiceId }): boolean {
  return b.usedCredit || (!!b.perk && SERVICES[b.serviceId].category === "treatment");
}

export function refundWindowEnds(memberSince: string): Date {
  return new Date(new Date(memberSince).getTime() + REFUND_WINDOW_DAYS * 864e5);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

// How much of this month is left, counting today.
export function monthLeft(now: Date): { remaining: number; daysInMonth: number } {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return { remaining: daysInMonth - now.getDate() + 1, daysInMonth };
}

export interface JoinCharge {
  amount: number;
  label: string;
  monthly: number | null;
  days?: { remaining: number; daysInMonth: number }; // set when the charge covers only part of the month
}

// What the card is charged today for moving to a tier. A Wellness Account joining mid-month pays only
// for the rest of the month, then the full rate from the 1st. Restore is never prorated.
// CONFIRM: other switches (a trial or a member changing plans) still charge the full amount.
export function joinCharge(from: TierId, to: TierId, now = new Date()): JoinCharge {
  const tier = TIERS[to];
  if (!tier.monthly) return { amount: tier.joinFee, label: `${tier.name} fee`, monthly: null };
  const label = `${tier.name} membership · first month`;
  const { remaining, daysInMonth } = monthLeft(now);
  if (TIERS[from].isMember || tier.neverProrated || remaining === daysInMonth) return { amount: tier.monthly, label, monthly: tier.monthly };
  const month = now.toLocaleDateString("en-US", { month: "long" });
  return {
    amount: Math.round((tier.monthly * remaining * 100) / daysInMonth) / 100,
    label: `${tier.name} membership · rest of ${month} (${remaining} of ${daysInMonth} days)`,
    monthly: tier.monthly,
    days: { remaining, daysInMonth },
  };
}
