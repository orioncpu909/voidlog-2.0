import clsx from "clsx";
import { Quote } from "@/lib/data";
import { money, shortDate } from "@/lib/format";

// Shows exactly one price: the one this person pays. When it's a discount (a promo, the first-visit
// price, or Restore's 25% off) the regular price appears crossed out next to it.
// `pill` puts a paid price in the same soft bubble as "Included", as the Book list rows show it.
export function PriceTag({ quote, size = "sm", pill = false }: { quote: Quote; size?: "sm" | "lg"; pill?: boolean }) {
  const big = size === "lg";
  const discounted = quote.kind === "promo" || quote.kind === "firstVisit" || quote.kind === "memberOff";
  if (pill && quote.kind !== "included" && quote.kind !== "perk") {
    return (
      <span className="inline-flex items-baseline gap-1 rounded-full bg-moss-soft px-2.5 py-0.5 text-xs text-moss">
        {discounted && <span className="line-through opacity-60">{money(quote.regular)}</span>}
        <span className={clsx("font-medium", discounted && "text-sage-deep")}>{money(quote.price)}</span>
      </span>
    );
  }
  if (quote.kind === "included" || quote.kind === "perk") {
    return <span className={clsx("rounded-full bg-moss-soft text-moss", big ? "px-3 py-1 text-base" : "px-2.5 py-0.5 text-xs")}>Included</span>;
  }
  return (
    <span className={clsx("inline-flex items-baseline gap-1.5", big && "flex-wrap justify-end")}>
      {discounted && <span className={clsx("text-muted line-through", big ? "text-base" : "text-xs")}>{money(quote.regular)}</span>}
      <span className={clsx("font-medium", discounted ? "text-sage-deep" : "text-shell", big ? "stat-num text-2xl" : "text-sm")}>{money(quote.price)}</span>
    </span>
  );
}

export function PromoNote({ quote }: { quote: Quote }) {
  // The first-visit discount is never described as a percentage; people just see the price.
  if (quote.kind === "firstVisit") {
    return (
      <span className="inline-flex items-center rounded-full bg-moss-soft px-2 py-0.5 text-[11px] font-medium text-sage-deep">
        First visit price
      </span>
    );
  }
  // Restore's 25% off, or "Included this month" for a monthly perk.
  if (quote.tag) {
    return (
      <span className="inline-flex items-center rounded-full bg-moss-soft px-2 py-0.5 text-[11px] font-medium text-sage-deep">{quote.tag}</span>
    );
  }
  if (quote.kind !== "promo" || !quote.promo) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-moss-soft px-2 py-0.5 text-[11px] font-medium text-sage-deep">
      {quote.promo.name} · until {shortDate(quote.promo.ends)}
    </span>
  );
}
