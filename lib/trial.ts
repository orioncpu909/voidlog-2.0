// 7-day trial rules, from the 2026 trial agreement:
// - One trial per account, ever.
// - $29 up front. When the 7 days end, the trial becomes the membership the member picked
//   (Restore, Classic or Gold). Classic if they never pick. Cancelling stops it.
// - The $29 is subtracted from the first month, which is prorated to the end of that month.
import { TIERS, TierId } from "./data";

export const TRIAL_DAYS = 7;
export const TRIAL_BECOMES: TierId = "classic"; // the default when the member doesn't choose
export const TRIAL_CHOICES: TierId[] = ["restore", "classic", "gold"];

export function trialEndsAt(start: Date): Date {
  return new Date(start.getTime() + TRIAL_DAYS * 864e5);
}

export function daysLeft(endsAt: Date, now = new Date()): number {
  return Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 864e5));
}

// What the card is charged when the trial converts: the rest of that month at the
// membership rate, minus the trial fee already paid.
export function firstMonthCharge(endsAt: Date, becomes: TierId = TRIAL_BECOMES): number {
  const monthly = TIERS[becomes].monthly ?? 0;
  const daysInMonth = new Date(endsAt.getFullYear(), endsAt.getMonth() + 1, 0).getDate();
  const remaining = daysInMonth - endsAt.getDate() + 1;
  const amount = (monthly * remaining) / daysInMonth - TIERS.trial.joinFee;
  return Math.max(0, Math.round(amount * 100) / 100);
}
