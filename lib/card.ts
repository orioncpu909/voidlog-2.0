// The card on file. Only the brand, last 4 digits and expiry are ever kept: the full number and
// security code stay in the form and are gone when it closes. With a backend, these fields should
// be the payment provider's hosted fields, so card numbers never touch ARTHA's app at all.
export interface CardOnFile {
  brand: string;
  last4: string;
  expMonth: number; // 1–12
  expYear: number; // e.g. 2029
}

interface Brand {
  name: string;
  match: RegExp;
  lengths: number[];
  cvc: number;
}

const BRANDS: Brand[] = [
  { name: "Visa", match: /^4/, lengths: [13, 16, 19], cvc: 3 },
  { name: "Mastercard", match: /^(5[1-5]|2(22[1-9]|2[3-9]|[3-6]|7[01]|720))/, lengths: [16], cvc: 3 },
  { name: "American Express", match: /^3[47]/, lengths: [15], cvc: 4 },
  { name: "Discover", match: /^(6011|65|64[4-9])/, lengths: [16], cvc: 3 },
];

const MAX_YEARS_AHEAD = 20;

export const digitsOnly = (input: string) => input.replace(/\D/g, "");
const brandOf = (digits: string) => BRANDS.find((b) => b.match.test(digits));
export const cardBrand = (input: string) => brandOf(digitsOnly(input))?.name;

// Spaces as a card shows them: 4-4-4-4, or 4-6-5 for American Express.
export function formatCardNumber(input: string): string {
  const digits = digitsOnly(input).slice(0, 19);
  if (brandOf(digits)?.name === "American Express") return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(" ");
  return digits.replace(/(.{4})(?=.)/g, "$1 ");
}

export function formatExpiry(input: string): string {
  const digits = digitsOnly(input).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

// The check digit every real card number passes, which catches almost every typo.
function luhn(digits: string): boolean {
  const sum = [...digits].reverse().reduce((total, d, i) => {
    const n = Number(d) * (i % 2 ? 2 : 1);
    return total + (n > 9 ? n - 9 : n);
  }, 0);
  return sum % 10 === 0;
}

export function cardNumberError(input: string): string {
  const digits = digitsOnly(input);
  if (!digits) return "Enter your card number.";
  const brand = brandOf(digits);
  if (!brand) return "We take Visa, Mastercard, American Express and Discover.";
  if (!brand.lengths.includes(digits.length) || !luhn(digits)) return "Check your card number.";
  return "";
}

const parseExpiry = (input: string) => {
  const [, month, year] = input.match(/^(\d{2})\/(\d{2})$/) ?? [];
  return month ? { expMonth: Number(month), expYear: 2000 + Number(year) } : null;
};

export const isExpired = (c: Pick<CardOnFile, "expMonth" | "expYear">, now = new Date()) => c.expYear * 12 + c.expMonth < now.getFullYear() * 12 + now.getMonth() + 1;

export function expiryError(input: string, now = new Date()): string {
  const expiry = parseExpiry(input);
  if (!expiry || expiry.expMonth < 1 || expiry.expMonth > 12) return "Use MM/YY, like 08/29.";
  if (isExpired(expiry, now)) return "This card has expired.";
  if (expiry.expYear > now.getFullYear() + MAX_YEARS_AHEAD) return "Check the expiry date.";
  return "";
}

export function cvcError(input: string, cardNumber: string): string {
  const length = brandOf(digitsOnly(cardNumber))?.cvc ?? 3;
  return new RegExp(`^\\d{${length}}$`).test(input) ? "" : `Enter the ${length}-digit security code.`;
}

export const zipError = (input: string) => (/^\d{5}$/.test(input) ? "" : "Enter your 5-digit ZIP code.");

// What gets kept from a valid form.
export function toCardOnFile(number: string, expiry: string): CardOnFile {
  const digits = digitsOnly(number);
  return { brand: brandOf(digits)!.name, last4: digits.slice(-4), ...parseExpiry(expiry)! };
}

export const cardLabel = (c: CardOnFile) => `${c.brand} ending in ${c.last4}`;
export const cardExpiry = (c: CardOnFile) => `${String(c.expMonth).padStart(2, "0")}/${String(c.expYear).slice(-2)}`;
