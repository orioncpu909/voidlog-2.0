import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// A section that stays folded to a single row until tapped, for secondary information (policies,
// contact details, demo controls) so the page stays short.
export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-line bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-serif text-xl [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={18} className="shrink-0 text-muted transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-line px-4 py-3 text-sm">{children}</div>
    </details>
  );
}
