// Offerings, account types, prices and promos.
// Sources: artha.la (services, durations, descriptions, Restore, promo end date), the current
// ARTHA app (Wellness/regular prices), Miguel's Oct 2026 Classic/Gold pricing, and the 2026
// membership agreements (Trial, late-cancel rules). Values marked CONFIRM are assumptions.

export type LocationId = "scity" | "weho";

export interface Location {
  id: LocationId;
  name: string;
  short: string;
  address: string;
  phone: string;
  email: string;
}

export const LOCATIONS: Record<LocationId, Location> = {
  weho: { id: "weho", name: "ARTHA West LA", short: "West LA", address: "12121 Olympic Blvd, Los Angeles", phone: "424.317.0005", email: "westedge@artha.la" },
  scity: { id: "scity", name: "ARTHA Studio City", short: "Studio City", address: "12169 Ventura Blvd, Studio City", phone: "818.856.8238", email: "studiocity@artha.la" },
};

// Everything in the same price group costs the same for a given account type.
export type PriceGroup = "class" | "cryo" | "sauna" | "float" | "contrast" | "redlight" | "hbot" | "treatment";

export type ServiceId =
  | "class"
  | "cryo"
  | "ir-sauna"
  | "float"
  | "contrast"
  | "red-light"
  | "hbot"
  | "massage"
  | "em-sculpt"
  | "cryo-facial"
  | "thermal-shock"
  | "endermologie"
  | "event";

export type Category = "class" | "therapy" | "treatment" | "event";

// "standard": cancel within 3 hours or no-show is late.
// "full": cancel within 12 hours or no-show is late (therapist treatments and contrast).
export type CancelPolicy = "standard" | "full";

// ARTHA's "Move. Sweat. Freeze." pillars, plus Restore for float and HBOT.
export type Pillar = "Move" | "Sweat" | "Freeze" | "Sweat + Freeze" | "Restore";

export interface Service {
  id: ServiceId;
  name: string;
  category: Category;
  group: PriceGroup | "event"; // events have one flat ticket price instead of a price group
  durationMin: number;
  capacity: number; // rooms or therapists per slot; CONFIRM
  policy: CancelPolicy;
  locations: LocationId[];
  pillar?: Pillar;
  description: string; // one or two short sentences shown when choosing a service
}

const BOTH: LocationId[] = ["weho", "scity"];

export const SERVICES: Record<ServiceId, Service> = {
  class: {
    id: "class", name: "Class", category: "class", group: "class", durationMin: 60, capacity: 15, policy: "standard", locations: BOTH, pillar: "Move",
    description: "Yoga, Mat Pilates, HIIT and Sound Bath. Select classes are held under infrared heat panels for a deeper sweat.",
  },

  cryo: {
    id: "cryo", name: "Cryo Therapy", category: "therapy", group: "cryo", durationMin: 3, capacity: 1, policy: "standard", locations: BOTH, pillar: "Freeze",
    description: "A few minutes of brief, intense cold to ease soreness, support recovery and leave you energized.",
  },
  "ir-sauna": {
    id: "ir-sauna", name: "Infrared Sauna", category: "therapy", group: "sauna", durationMin: 45, capacity: 3, policy: "standard", locations: BOTH, pillar: "Sweat",
    description: "A private infrared sauna. Soothing heat for relaxation, circulation and recovery.",
  },
  "red-light": {
    id: "red-light", name: "Full Body Red Light", category: "therapy", group: "redlight", durationMin: 15, capacity: 1, policy: "standard", locations: BOTH, pillar: "Sweat",
    description: "Lie back in a full-body red light bed designed to support skin health, recovery and overall vitality.",
  },
  contrast: {
    id: "contrast", name: "Contrast (Sauna + Plunge)", category: "therapy", group: "contrast", durationMin: 45, capacity: 2, policy: "full", locations: BOTH, pillar: "Sweat + Freeze",
    description: "Alternate between infrared heat and a cold plunge to get circulation going and support recovery.",
  },
  float: {
    id: "float", name: "Float", category: "therapy", group: "float", durationMin: 45, capacity: 2, policy: "standard", locations: BOTH, pillar: "Restore",
    description: "Sensory-deprivation float. Drift weightless in warm water, in quiet darkness, for deep rest.",
  },
  hbot: {
    id: "hbot", name: "Hyperbaric Oxygen Therapy", category: "therapy", group: "hbot", durationMin: 50, capacity: 1, policy: "standard", locations: BOTH, pillar: "Restore",
    description: "Relax and breathe concentrated oxygen in a pressurized chamber. A treatment credit can cover it.",
  },

  massage: {
    id: "massage", name: "Massage", category: "treatment", group: "treatment", durationMin: 50, capacity: 2, policy: "full", locations: BOTH,
    description: "50 minutes of hands-on bodywork, for pure relaxation or to work out tight, sore muscles.",
  },
  "em-sculpt": {
    id: "em-sculpt", name: "EM BodySculpting", category: "treatment", group: "treatment", durationMin: 50, capacity: 1, policy: "full", locations: ["weho"],
    description: "Non-invasive electromagnetic treatment that contracts muscles to tone and sculpt target areas.",
  },
  // Studio City's treatments: Massage, Cryo Facial, T-Shock Therapy and Endermologie.
  // CONFIRM: artha.la doesn't describe these; the copy below is general, and Endermologie's length
  // is assumed to match the other treatments.
  "cryo-facial": {
    id: "cryo-facial", name: "Cryo Facial", category: "treatment", group: "treatment", durationMin: 50, capacity: 1, policy: "full", locations: ["scity"],
    description: "A cold facial that tightens, brightens and calms the skin.",
  },
  "thermal-shock": {
    id: "thermal-shock", name: "T-Shock Therapy", category: "treatment", group: "treatment", durationMin: 50, capacity: 1, policy: "full", locations: ["scity"],
    description: "Alternates targeted heat and cold to tone and tighten the skin and smooth the look of cellulite on specific areas.",
  },
  endermologie: {
    id: "endermologie", name: "Endermologie", category: "treatment", group: "treatment", durationMin: 50, capacity: 1, policy: "full", locations: ["scity"],
    description: "A mechanical massage that gently lifts and rolls the skin to boost circulation and lymphatic flow and smooth the look of cellulite.",
  },

  // Ticketed events (special and private classes, workshops). Times and titles come from lib/events.ts.
  event: {
    id: "event", name: "Event", category: "event", group: "event", durationMin: 60, capacity: 15, policy: "standard", locations: BOTH,
    description: "Special classes, workshops and private classes.",
  },
};

// Every ticketed event costs the same for every account, Wellness included.
export const EVENT_TICKET_PRICE = 10;

export const POLICY = {
  standard: { windowHours: 3 },
  full: { windowHours: 12 },
} as const;

// Treatment credits cover anything priced as a treatment, plus HBOT.
export const CREDIT_GROUPS: PriceGroup[] = ["treatment", "hbot"];

export type TierId = "wellness" | "trial" | "restore" | "classic" | "gold";

export interface Tier {
  id: TierId;
  name: string;
  isMember: boolean;
  monthly: number | null;
  joinFee: number;
  summary: string;
  prices: Record<PriceGroup, number>;
  welcomeCredits: number;
  monthlyCredits: number;
  lockedToHome: boolean; // therapies and treatments only at the home location (see bookableAt)
  monthlyPerks?: Partial<Record<ServiceId, number>>; // free each calendar month, used before any discount
  memberDiscountPct?: number; // shown as "{name} · N% off" wherever its prices appear
}

// What a monthly perk is called in "this month's included …".
export const PERK_LABEL: Partial<Record<ServiceId, string>> = { class: "class", "ir-sauna": "sauna", cryo: "cryo", massage: "massage" };

// Wellness account = free non-member account. These are the regular prices.
const REGULAR: Record<PriceGroup, number> = {
  class: 29,
  cryo: 29,
  sauna: 49,
  float: 69,
  contrast: 69,
  redlight: 69,
  hbot: 200,
  treatment: 200,
};

function percentOff(prices: Record<PriceGroup, number>, pct: number): Record<PriceGroup, number> {
  return Object.fromEntries(Object.entries(prices).map(([g, p]) => [g, Math.round(p * (100 - pct)) / 100])) as Record<PriceGroup, number>;
}

const CLASSIC: Record<PriceGroup, number> = {
  class: 0,
  cryo: 0,
  sauna: 5,
  float: 19,
  contrast: 19,
  redlight: 19,
  hbot: 125,
  treatment: 125,
};

export const TIERS: Record<TierId, Tier> = {
  wellness: {
    id: "wellness",
    name: "Wellness Account",
    isMember: false,
    monthly: null,
    joinFee: 0,
    summary: "Free account. Pay per visit at either location.",
    prices: REGULAR,
    welcomeCredits: 0,
    monthlyCredits: 0,
    lockedToHome: false,
  },
  trial: {
    id: "trial",
    name: "7-Day Trial",
    isMember: true,
    monthly: null,
    joinFee: 29,
    summary: "One week of included classes and cryo. No late-cancel fees.",
    prices: { class: 0, cryo: 0, sauna: 5, float: 5, contrast: 19, redlight: 69, hbot: 200, treatment: 125 },
    welcomeCredits: 0,
    monthlyCredits: 0,
    lockedToHome: true,
  },
  restore: {
    id: "restore",
    name: "Restore",
    isMember: true,
    monthly: 125,
    joinFee: 0,
    // From artha.la/memberships: 1 massage, 1 sauna, 1 cryo and 1 class per month (unused massage
    // rolls over), extra massage $125, 25% off regular prices for everything else.
    // The four perks are free each month; after one is used, that service is 25% off.
    // CONFIRM: the unused-massage rollover isn't modeled.
    summary: "1 massage, 1 sauna, 1 cryo and 1 class each month. 25% off everything else.",
    prices: { ...percentOff(REGULAR, 25), treatment: 125 },
    welcomeCredits: 4,
    monthlyCredits: 0,
    lockedToHome: true,
    monthlyPerks: { class: 1, "ir-sauna": 1, cryo: 1, massage: 1 },
    memberDiscountPct: 25,
  },
  classic: {
    id: "classic",
    name: "Classic",
    isMember: true,
    monthly: 199,
    joinFee: 0,
    summary: "Classes and cryo included. Sauna $5, float, contrast and red light $19, treatments $125.",
    prices: CLASSIC,
    welcomeCredits: 4,
    monthlyCredits: 0,
    lockedToHome: true,
  },
  gold: {
    id: "gold",
    name: "Gold",
    isMember: true,
    monthly: 299,
    joinFee: 0,
    summary: "Classes and all therapies included, plus 1 treatment credit every month.",
    prices: { class: 0, cryo: 0, sauna: 0, float: 0, contrast: 0, redlight: 0, hbot: 125, treatment: 125 },
    welcomeCredits: 4,
    monthlyCredits: 1,
    lockedToHome: true,
  },
};

export const MEMBERSHIP_ORDER: TierId[] = ["restore", "classic", "gold", "trial"];

// Promos give Wellness accounts a special rate for a set period.
// A promo always runs at both locations, so there is no per-location setting.
export interface Promo {
  id: string;
  name: string;
  starts: string; // YYYY-MM-DD
  ends: string; // YYYY-MM-DD, inclusive
  prices: Partial<Record<PriceGroup, number>>;
}

export const PROMOS: Promo[] = [
  {
    id: "classes-9",
    name: "$9 classes",
    starts: "2026-10-01", // CONFIRM start date
    ends: "2026-11-01", // artha.la: "ends Nov 1"
    prices: { class: 9 },
  },
  {
    id: "cryo-10",
    name: "Cryo special",
    starts: "2026-10-01", // CONFIRM start date
    ends: "2026-12-31", // CONFIRM: artha.la lists $10 cryo as limited-time with no end date
    prices: { cryo: 10 },
  },
];

// "perk": free as a monthly membership perk. "memberOff": a member's percentage discount (Restore).
export type QuoteKind = "included" | "perk" | "member" | "memberOff" | "promo" | "regular" | "firstVisit";

// A new account's very first paid appointment is discounted: classes and therapies are half off,
// HBOT and treatments drop to $125. Doesn't apply to special (promo) prices or event tickets.
export const FIRST_VISIT_DISCOUNT = 0.5;
// HBOT and treatments aren't half off on a first visit; they drop to a set price instead.
export const FIRST_VISIT_FIXED: Partial<Record<PriceGroup, number>> = { hbot: 125, treatment: 125 };

export interface Quote {
  price: number;
  regular: number;
  kind: QuoteKind;
  label: string;
  promo?: Promo;
  creditEligible: boolean;
  tag?: string; // short note shown beside the price, e.g. "Restore · 25% off"
}

export function currentPromos(date: string): Promo[] {
  return PROMOS.filter((p) => date >= p.starts && date <= p.ends);
}

function activePromo(group: PriceGroup, date: string): Promo | undefined {
  return PROMOS.find((p) => date >= p.starts && date <= p.ends && p.prices[group] !== undefined);
}

// The one price a person sees and pays. Every screen uses this.
// Members take classes (and events) at either location, but their therapies and treatments are
// at their home location. Wellness Accounts can book anything at both.
export function bookableAt(tier: Tier, serviceId: ServiceId, location: LocationId, home: LocationId): boolean {
  const service = SERVICES[serviceId];
  if (!service.locations.includes(location)) return false;
  return !tier.lockedToHome || service.category === "class" || service.category === "event" || location === home;
}

export function priceFor(tierId: TierId, serviceId: ServiceId, location: LocationId, date: string, firstVisit = false): Quote {
  const base = basePrice(tierId, serviceId, location, date);
  const group = SERVICES[serviceId].group;
  // Never stacks: specials and event tickets keep their own price.
  if (!firstVisit || base.price === 0 || base.kind === "promo" || group === "event") return base;
  const fixed = FIRST_VISIT_FIXED[group];
  const price = fixed !== undefined ? Math.min(base.price, fixed) : Math.round(base.price * (1 - FIRST_VISIT_DISCOUNT) * 100) / 100;
  if (price >= base.price) return base; // already at or below the first-visit price
  return { ...base, price, regular: base.price, kind: "firstVisit", promo: undefined };
}

function basePrice(tierId: TierId, serviceId: ServiceId, location: LocationId, date: string): Quote {
  const tier = TIERS[tierId];
  const group = SERVICES[serviceId].group;
  if (group === "event") {
    return { price: EVENT_TICKET_PRICE, regular: EVENT_TICKET_PRICE, kind: "regular", label: "Event ticket · same price for everyone", creditEligible: false };
  }
  const regular = REGULAR[group];
  const creditEligible = CREDIT_GROUPS.includes(group);

  if (!tier.isMember) {
    const promo = activePromo(group, date);
    if (promo) return { price: promo.prices[group]!, regular, kind: "promo", label: "Special rate for Wellness Accounts", promo, creditEligible };
    return { price: regular, regular, kind: "regular", label: "Wellness Account price", creditEligible };
  }
  const price = tier.prices[group];
  if (price === 0) return { price: 0, regular, kind: "included", label: `Included with ${tier.name}`, creditEligible };
  const pct = tier.memberDiscountPct;
  if (pct && price === percentOff(REGULAR, pct)[group]) {
    return { price, regular, kind: "memberOff", label: `${tier.name} member price`, tag: `${tier.name} · ${pct}% off`, creditEligible };
  }
  return { price, regular, kind: "member", label: `${tier.name} member price`, creditEligible };
}
