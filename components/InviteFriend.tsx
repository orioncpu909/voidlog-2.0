"use client";

import { useState } from "react";
import { Check, ChevronRight, Copy, Share2, UserRoundPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import { referralLink, shareTitle } from "@/lib/referral";
import { Sheet } from "@/components/Sheet";

// The invite tile on Account, beside the card on file, for Wellness and trial accounts (paying
// members have guest passes in that spot). It shares the account's personal link, which opens
// the app straight on the create-account screen, so a friend can sign up for a free account.
export function InviteFriendTile() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex min-h-[112px] w-full flex-col rounded-2xl border border-line bg-card p-3.5 text-left transition-colors active:bg-sand">
        <span className="flex w-full items-center justify-between">
          <UserRoundPlus size={20} />
          <ChevronRight size={16} />
        </span>
        <span className="mt-2 block text-xs text-muted">Refer a friend</span>
        <span className="block text-sm font-medium">Free account</span>
        <span className="block text-xs text-muted">Send your link</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Refer a friend">
        {open && <InviteSheet />}
      </Sheet>
    </>
  );
}

function InviteSheet() {
  const { member } = useStore();
  const [copied, setCopied] = useState(false);
  const link = referralLink(member);
  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(link);
      ok = true;
    } catch {
      // Older phone browsers: copy through a hidden text field instead.
      const field = document.createElement("textarea");
      field.value = link;
      field.setAttribute("readonly", "");
      field.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(field);
      field.select();
      ok = document.execCommand("copy");
      field.remove();
    }
    if (!ok) return; // Still blocked: the link is on screen to copy by hand.
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: shareTitle(member), text: "Join me at ARTHA. Sign up with my link:", url: link });
      else await copy();
    } catch {
      // Closing the share sheet isn't an error worth showing.
    }
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Your link opens ARTHA&apos;s sign-up, so a friend can create a free Wellness Account in a minute. New accounts also get the 7-day trial offer.
      </p>
      <button
        onClick={copy}
        aria-label="Copy your invite link"
        className="flex w-full items-center gap-2 rounded-2xl border border-line bg-sand px-3 py-2.5 text-left active:bg-line"
      >
        <span className="min-w-0 flex-1 truncate text-sm">{link.replace("https://", "")}</span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-moss">
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
        </span>
      </button>
      <button onClick={share} className="flex w-full items-center justify-center gap-2 rounded-full bg-sage py-3 text-sm font-semibold text-ink active:opacity-80">
        <Share2 size={16} /> Share my link
      </button>
      <p className="text-xs text-muted">Friends who join with your link show up under Profile → Your referrals.</p>
    </div>
  );
}
