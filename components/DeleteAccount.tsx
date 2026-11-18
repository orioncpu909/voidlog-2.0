"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { sessionStart } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import { Button, Sheet } from "@/components/Sheet";

// Account → Contact us, for Wellness Accounts: delete the account from the app, no front desk.
// Members cancel their membership first (it can end in a deleted account), so they don't see this.
export function DeleteAccountButton() {
  const { member, bookings, deleteAccount } = useStore();
  const [open, setOpen] = useState(false);
  if (member.tier !== "wellness") return null;
  const now = new Date();
  const upcoming = bookings.filter((b) => b.status === "booked" && sessionStart(b.date, b.time) > now).length;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-line bg-card text-sm font-medium text-shell active:bg-line"
      >
        <Trash2 size={16} /> Delete account
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Delete your account?">
        {open && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              This deletes your Wellness Account and your booking history. It can&apos;t be undone.
            </p>
            {upcoming > 0 && (
              <p className="text-sm text-muted">
                Your {upcoming === 1 ? "upcoming booking is" : `${upcoming} upcoming bookings are`} cancelled, and anything you paid for{" "}
                {upcoming === 1 ? "it" : "them"} is refunded to your card.
              </p>
            )}
            <p className="text-sm text-muted">You can always create a new account later.</p>
            <div className="space-y-2 pt-1">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Keep my account
              </Button>
              <Button variant="danger" onClick={deleteAccount}>
                Delete my account
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
