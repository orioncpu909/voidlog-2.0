"use client";

import { useState, type InputHTMLAttributes } from "react";
import clsx from "clsx";
import { ChevronRight, CreditCard } from "lucide-react";
import { TIERS } from "@/lib/data";
import { useStore } from "@/lib/store";
import {
  CardOnFile, cardBrand, cardExpiry, cardLabel, cardNumberError, cvcError, digitsOnly, expiryError, formatCardNumber, formatExpiry, isExpired, toCardOnFile, zipError,
} from "@/lib/card";
import { Button, Sheet } from "@/components/Sheet";

// The card on file on Account. The whole row opens the sheet to change it (or add one).
export function CardOnFileRow() {
  const { member, setCard } = useStore();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<CardOnFile | null>(null);
  const card = member.card;
  const expired = !!card && isExpired(card);
  const close = () => {
    setOpen(false);
    setSaved(null);
  };
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-left transition-colors active:bg-sand">
        <CreditCard size={20} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted">Card on file</span>
          <span className="block truncate text-sm font-medium">{card ? cardLabel(card) : "No card yet"}</span>
          {card && <span className={clsx("block text-xs", expired ? "font-medium text-clay" : "text-muted")}>{expired ? `Expired ${cardExpiry(card)}` : `Expires ${cardExpiry(card)}`}</span>}
        </span>
        <span className="flex shrink-0 items-center text-sm font-medium text-moss">
          {card ? "Change" : "Add"} <ChevronRight size={16} />
        </span>
      </button>
      <Sheet open={open} onClose={close} title={saved ? "Card saved" : card ? "Change card" : "Add a card"}>
        {saved ? (
          <div className="space-y-4">
            <p className="text-sm">
              {TIERS[member.tier].monthly ? "Your next payment and any new bookings" : "New bookings"} will use your {cardLabel(saved)}. Refunds on earlier payments still go back to the card you paid with.
            </p>
            <Button onClick={close}>Done</Button>
          </div>
        ) : (
          <CardForm
            current={card}
            onSave={(next) => {
              setCard(next);
              setSaved(next);
            }}
          />
        )}
      </Sheet>
    </>
  );
}

// Only the brand, last 4 and expiry leave this form. It's unmounted when the sheet closes.
function CardForm({ current, onSave }: { current?: CardOnFile; onSave: (card: CardOnFile) => void }) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [zip, setZip] = useState("");
  const [checked, setChecked] = useState(false);
  const errors = { number: cardNumberError(number), expiry: expiryError(expiry), cvc: cvcError(cvc, number), zip: zipError(zip) };
  const show = (error: string) => (checked ? error : "");
  const brand = cardBrand(number);

  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setChecked(true);
        if (!Object.values(errors).some(Boolean)) onSave(toCardOnFile(number, expiry));
      }}
    >
      {current && <p className="rounded-xl bg-sand px-3 py-2 text-sm">Now using your {cardLabel(current)}</p>}
      <Field
        label="Card number"
        hint={brand}
        error={show(errors.number)}
        value={number}
        onChange={(e) => setNumber(formatCardNumber(e.target.value))}
        inputMode="numeric"
        autoComplete="cc-number"
        name="cardnumber"
        placeholder="1234 5678 9012 3456"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Expiry"
          error={show(errors.expiry)}
          value={expiry}
          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
          inputMode="numeric"
          autoComplete="cc-exp"
          name="exp-date"
          placeholder="MM/YY"
        />
        <Field
          label="Security code"
          error={show(errors.cvc)}
          value={cvc}
          onChange={(e) => setCvc(digitsOnly(e.target.value).slice(0, 4))}
          inputMode="numeric"
          autoComplete="cc-csc"
          name="cvc"
          placeholder="CVC"
        />
      </div>
      <Field
        label="Billing ZIP code"
        error={show(errors.zip)}
        value={zip}
        onChange={(e) => setZip(digitsOnly(e.target.value).slice(0, 5))}
        inputMode="numeric"
        autoComplete="postal-code"
        name="postal"
        placeholder="90064"
      />
      <Button>Save card</Button>
      <p className="text-center text-xs text-muted">Demo: no card is charged. Only the card type, last 4 digits and expiry are saved.</p>
    </form>
  );
}

function Field({ label, error, hint, ...input }: { label: string; error?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        {...input}
        aria-invalid={!!error}
        className={clsx("mt-1 w-full rounded-xl border bg-card px-3.5 py-3 text-base outline-none transition focus:border-shell", error ? "border-clay" : "border-line")}
      />
      {error ? <span className="mt-1 block text-xs text-clay">{error}</span> : hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
