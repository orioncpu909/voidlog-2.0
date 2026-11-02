"use client";

import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const TAP_GUARD_MS = 400;

// False for a moment after appearing, so the second tap of a double tap can't land on whatever
// just opened under the finger (a Confirm, or a Yes, cancel).
export function useTapGuard(active = true): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    if (!active) return;
    const id = setTimeout(() => setReady(true), TAP_GUARD_MS);
    return () => clearTimeout(id);
  }, [active]);
  return ready;
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ready = useTapGuard(open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      {!ready && <div className="absolute inset-0 z-10" aria-hidden />}
      <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-line bg-card px-5 pb-8 pt-5 text-shell shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl leading-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-muted hover:bg-line">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary: "bg-sage text-ink hover:bg-sage/90", // gold pill
    secondary: "border border-line bg-card text-shell hover:bg-line",
    danger: "border border-clay-deep text-clay active:bg-clay-soft",
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-full px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
