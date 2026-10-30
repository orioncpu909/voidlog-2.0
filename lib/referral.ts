// Referrals: every account has a personal code and link. Someone who signs up with it is linked to
// the account that referred them. When that friend's first monthly membership payment goes
// through, the referrer automatically gets 1 treatment credit, once per friend, if the referrer
// is a paying member (Restore, Classic or Gold) at that moment.
// CONFIRM: what a Wellness or Trial referrer gets, whether a refunded first month (cancelled within
// 5 days) takes the credit back, and the real link format (artha.la doesn't read ?ref= yet).
import type { Member } from "./store";

export const REFERRAL_CREDITS = 1;

// What a referred friend's referral came to, once their first monthly payment went through.
export type ReferralResult = "credited" | "not-member";

// The same code every time for an account: its first name plus four letters or digits.
export function referralCode(member: Pick<Member, "id" | "name">): string {
  let h = 0;
  for (const c of member.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const first = member.name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "");
  return `${first}${h.toString(36).toUpperCase().slice(-4)}`;
}

export function referralLink(member: Pick<Member, "id" | "name">): string {
  return `https://artha.la/join?ref=${referralCode(member)}`;
}

// Accepts a code or a pasted link, in any case.
export function findReferrer(input: string, members: Member[]): Member | undefined {
  const code = (input.match(/ref=([A-Za-z0-9]+)/)?.[1] ?? input).trim().toUpperCase();
  if (!code) return undefined;
  return members.find((m) => m.signedUp !== false && referralCode(m) === code);
}
