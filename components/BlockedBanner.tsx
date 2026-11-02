"use client";

import { useEffect } from "react";
import { Info, X } from "lucide-react";

// Why a booking can't go through, in a pop-up across the top. It clears itself after a few seconds.
const SHOW_MS = 7000;

export function BlockedBanner({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const id = setTimeout(onClose, SHOW_MS);
    return () => clearTimeout(id);
  }, [message, onClose]);

  return (
    <div role="alert" className="fixed inset-x-4 top-16 z-[80] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-clay-deep bg-card px-4 py-3 text-sm text-shell shadow-lg">
      <Info size={18} className="mt-0.5 shrink-0 text-clay" />
      <p className="min-w-0 flex-1 leading-snug">
        <span className="block font-medium">You can&apos;t book this time</span>
        {message}
      </p>
      <button onClick={onClose} aria-label="Dismiss" className="-m-1.5 shrink-0 rounded-full p-1.5 text-muted active:bg-line">
        <X size={16} />
      </button>
    </div>
  );
}
