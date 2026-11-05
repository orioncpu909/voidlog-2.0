// When an account is next billed. Memberships bill on the 1st; see applyRenewals in lib/store.tsx.
import { TIERS } from "./data";
import { money, shortDate } from "./format";
import { dateKey } from "./schedule";
import type { Member } from "./store";
import { TRIAL_BECOMES, firstMonthCharge } from "./trial";

const day = (d: Date) => shortDate(dateKey(d));

export function nextBill(m: Pick<Member, "tier" | "membershipEndsAt" | "membershipCancel" | "trialEndsAt" | "trialBecomes" | "trialCancel">, now = new Date()): { headline: string; detail: string } {
  const tier = TIERS[m.tier];
  if (m.tier === "trial" && m.trialEndsAt) {
    const ends = new Date(m.trialEndsAt);
    if (m.trialCancel) {
      return { headline: "You won't be billed", detail: `Your trial ends ${day(ends)}, then ${m.trialCancel === "delete" ? "this account is deleted" : "you're on a free Wellness Account"}.` };
    }
    const starts = new Date(ends.getTime() + 1);
    const becomes = TIERS[m.trialBecomes ?? TRIAL_BECOMES];
    return {
      headline: `${day(starts)} · ${money(firstMonthCharge(starts, becomes.id))}`,
      detail: `Your trial ends ${day(ends)}, then ${becomes.name} starts. This ${becomes.neverProrated ? "is your first month" : "covers the rest of that month"}, minus your ${money(tier.joinFee)} trial fee. After that, ${money(becomes.monthly!)} on the 1st of every month.`,
    };
  }
  if (!tier.monthly) return { headline: "No monthly bill", detail: "You pay for each visit when you book it." };
  if (m.membershipEndsAt) {
    const then = m.membershipCancel === "delete" ? "this account is deleted" : "you're on a free Wellness Account";
    return { headline: "You won't be billed again", detail: `You keep ${tier.name} until ${day(new Date(m.membershipEndsAt))}, then ${then}.` };
  }
  return { headline: `${day(new Date(now.getFullYear(), now.getMonth() + 1, 1))} · ${money(tier.monthly)}`, detail: "Billed on the 1st of every month." };
}
