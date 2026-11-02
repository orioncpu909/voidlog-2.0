// 7-day trial rules, from the 2026 trial agreement:
// - One trial per account, ever.
// - $29 up front. When the 7 days end, the trial becomes the membership the member picked
//   (Restore, Classic or Gold). Classic if they never pick. Cancelling stops it.
// - The $29 is subtracted from the first month, which is prorated to the end of that month
//   (Restore never is: it pays the full month).
import { TIERS, TierId } from "./data";
import { monthLeft } from "./membership";

export const TRIAL_DAYS = 7;
export const TRIAL_BECOMES: TierId = "classic"; // the default when the member doesn't choose
export const TRIAL_CHOICES: TierId[] = ["restore", "classic", "gold"];

// The very end of the 7th day, counting the day it started as day 1.
export function trialEndsAt(start: Date): Date {
  const ends = new Date(start);
  ends.setDate(ends.getDate() + TRIAL_DAYS - 1);
  ends.setHours(23, 59, 59, 999);
  return ends;
}

export function daysLeft(endsAt: Date, now = new Date()): number {
  return Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 864e5));
}

// What the card is charged when the trial converts: from the membership's first day to the end of
// that month at the membership rate, minus the trial fee already paid.
export function firstMonthCharge(startsOn: Date, becomes: TierId = TRIAL_BECOMES): number {
  const monthly = TIERS[becomes].monthly ?? 0;
  const { remaining, daysInMonth } = monthLeft(startsOn);
  const share = TIERS[becomes].neverProrated ? 1 : remaining / daysInMonth;
  const amount = monthly * share - TIERS.trial.joinFee;
  return Math.max(0, Math.round(amount * 100) / 100);
}
