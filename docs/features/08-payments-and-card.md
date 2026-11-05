# Payments & card

Card on file, declined cards and billing.

5 features, 5 live. Back to the [feature list](README.md).

## Monthly renewal on the 1st

On the 1st of every month each active paid membership is charged its full monthly price and gets its monthly treatment credits (Gold gets 1). When credits are added, a note on Home and Account says "Your [plan] membership renewed, and X treatment credit(s) were added." A cancelled membership is never charged again. If the app hasn't been opened for a while it catches up on every month missed, except accounts saved before renewals existed, which catch up at most one month.

- **Where:** Automatic; note appears on Home and Account
- **Code:** `lib/store.tsx`

## Card on file display

Shows the saved card as brand and last 4 digits with its expiry. If the card has expired, it says "Expired" in red. If the card was declined, it says "Declined. Update it to book." Paying members see it as a half-width tile beside Guest passes. Others see a full row with "Add" or "Change" ("No card yet" if none). Sign-up does not ask for a card, so new accounts start without one.

- **Where:** Account tab > Card on file
- **Code:** `components/CardOnFileRow.tsx`, `app/membership/page.tsx`, `lib/card.ts`

## Add or change card form

Asks for card number, expiry, security code and billing ZIP. The card number spaces itself automatically (4-6-5 for American Express) and shows the card brand. Only Visa, Mastercard, American Express and Discover are accepted, and the number must pass the standard card-number check. Expiry must be MM/YY, not expired, and no more than 20 years ahead. The security code is 3 digits (4 for Amex), and the ZIP must be 5 digits. Errors show after the first tap on "Save card". When changing a card, it shows "Now using your [card]". Only the brand, last 4 digits and expiry are kept.

- **Where:** Account tab > Card on file > tap
- **Code:** `components/CardOnFileRow.tsx`, `lib/card.ts`

## Card saved confirmation

After saving, the sheet says your next payment (for paid members) and any new bookings will use the new card, and that refunds on earlier payments still go back to the card you paid with.

- **Where:** Account tab > Card on file > Save card
- **Code:** `components/CardOnFileRow.tsx`

## Card declined during booking

If a paid booking or event ticket fails because the card on file is declined or expired, the confirm step is replaced in the same sheet by "Your [card] was declined. You weren't charged. You must update your card to book." with Update card and Go back. Update card opens the card form right there, and saving a new card returns to the confirm step with "Card updated. You'll pay with your [card]." Free bookings (included, a monthly perk, a treatment credit or $0) never check the card and still go through, and having no card at all is not treated as a decline.

- **Where:** Book tab and Events > confirm step
- **Code:** `app/book/page.tsx`, `components/CardOnFileRow.tsx`, `lib/card.ts`, `lib/store.tsx`
