// Cancelling a paid membership (Restore, Classic, Gold):
// - Within the first 5 days: full refund, and the membership ends right away.
// - After that: no refund. Nothing more is charged, and the member keeps full access, prices
//   and their calendar until the end of the month. Then the account becomes a free Wellness Account.

export const REFUND_WINDOW_DAYS = 5;

export function inRefundWindow(memberSince: string | undefined, now = new Date()): boolean {
  return !!memberSince && now.getTime() - new Date(memberSince).getTime() < REFUND_WINDOW_DAYS * 864e5;
}

export function refundWindowEnds(memberSince: string): Date {
  return new Date(new Date(memberSince).getTime() + REFUND_WINDOW_DAYS * 864e5);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
