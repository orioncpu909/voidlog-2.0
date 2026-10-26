import clsx from "clsx";
import { Quote } from "@/lib/data";
import { money, shortDate } from "@/lib/format";

// Shows exactly one price: the one this person pays. During a promo the regular
// price appears crossed out next to it, so the special rate is obvious.
export function PriceTag({ quote, size = "sm" }: { quote: Quote; size?: "sm" | "lg" }) {
  const big = size === "lg";
  const discounted = quote.kind === "promo" || quote.kind === "firstVisit";
  if (quote.kind === "included") {
    return <span className={clsx("rounded-full bg-moss-soft text-moss", big ? "px-3 py-1 text-base" : "px-2.5 py-0.5 text-xs")}>Included</span>;
  }
  return (
    <span className={clsx("inline-flex items-baseline gap-1.5", big && "flex-wrap justify-end")}>
      {discounted && <span className={clsx("text-muted line-through", big ? "text-base" : "text-xs")}>{money(quote.regular)}</span>}
      <span className={clsx("font-medium", discounted ? "text-sage" : "text-ink", big ? "font-serif text-3xl" : "text-sm")}>{money(quote.price)}</span>
    </span>
  );
}

export function PromoNote({ quote }: { quote: Quote }) {
  if (quote.kind === "firstVisit") {
    const half = Math.abs(quote.price - quote.regular / 2) < 0.01;
    return (
      <span className="inline-flex items-center rounded-full bg-moss-soft px-2 py-0.5 text-[11px] font-medium text-sage">
        {half ? "First appointment · 50% off" : "First appointment price"}
      </span>
    );
  }
  if (quote.kind !== "promo" || !quote.promo) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-moss-soft px-2 py-0.5 text-[11px] font-medium text-sage">
      {quote.promo.name} · until {shortDate(quote.promo.ends)}
    </span>
  );
}
