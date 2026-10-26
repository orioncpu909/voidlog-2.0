"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-shell px-5 pb-8 pt-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl leading-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-muted hover:bg-sand">
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
    primary: "bg-moss text-shell hover:bg-moss/90",
    secondary: "border border-line bg-shell text-ink hover:bg-sand",
    danger: "bg-clay text-shell hover:bg-clay/90",
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
