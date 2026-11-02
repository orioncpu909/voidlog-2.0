"use client";

import { useEffect, type ReactNode } from "react";
import { Info, X } from "lucide-react";

// Why a booking can't go through, in a pop-up across the top. It clears itself after a few seconds,
// unless it's waiting on the member (persist).
const SHOW_MS = 7000;

export function BlockedBanner({
  message,
  onClose,
  title = "You can't book this time",
  persist = false,
  children,
}: {
  message: string;
  onClose: () => void;
  title?: string;
  persist?: boolean;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (persist) return;
    const id = setTimeout(onClose, SHOW_MS);
    return () => clearTimeout(id);
  }, [message, onClose, persist]);

  return (
    <div role="alert" className="fixed inset-x-4 top-16 z-[80] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-clay-deep bg-card px-4 py-3 text-sm text-shell shadow-lg">
      <Info size={18} className="mt-0.5 shrink-0 text-clay" />
      <div className="min-w-0 flex-1 leading-snug">
        <p>
          <span className="block font-medium">{title}</span>
          {message}
        </p>
        {children}
      </div>
      <button onClick={onClose} aria-label="Dismiss" className="-m-1.5 shrink-0 rounded-full p-1.5 text-muted active:bg-line">
        <X size={16} />
      </button>
    </div>
  );
}
