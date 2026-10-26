// Weekly class schedule from ARTHA's public booking pages (join.arthamindbodysoul.com),
// week of Oct 25–31, 2026. The demo repeats this week; therapy and treatment slots are generated.
import { LocationId, SERVICES, ServiceId } from "./data";
import { EVENTS } from "./events";
import { therapistsFor } from "./therapists";

export interface Session {
  id: string;
  serviceId: ServiceId;
  location: LocationId;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMin: number;
  title: string;
  instructor?: string;
  capacity: number;
  bookedByOthers: number;
}

// [time, minutes, class, instructor]
type ClassRow = [string, number, string, string];

// Index 0 = Sunday … 6 = Saturday.
const WEEK: Record<LocationId, ClassRow[][]> = {
  weho: [
    [
      ["09:00", 60, "Infrared Heated Power Yoga (All Levels)", "Remi Chiovaro"],
      ["10:30", 60, "Yoga Sculpt With Weights (All Levels)", "Dora Fish"],
      ["12:00", 60, "Mat Pilates", "Dora Fish"],
      ["16:00", 60, "Power Flow (All Levels)", "Annie Cui"],
    ],
    [
      ["07:30", 60, "Infrared Heated Mat Pilates", "Greg Peoples"],
      ["09:00", 60, "Power Flow (All Levels)", "Elizabeth Edis"],
      ["10:30", 60, "Yoga Sculpt With Weights (All Levels)", "Gabby Pariseau"],
      ["12:00", 60, "Power Flow (Int)", "Gabby Pariseau"],
      ["13:30", 45, "Infrared Heated HIIT (All Levels)", "Molly Wedgwood"],
      ["15:00", 60, "Mat Pilates", "Sarah Bellini"],
      ["16:30", 60, "Restorative Yoga & Sound Bath", "Julie Clark"],
      ["18:00", 60, "Power Flow (All Levels)", "Jessica Greene"],
      ["19:30", 60, "Mat Pilates", "Greg Peoples"],
    ],
    [
      ["06:15", 45, "Mat Pilates", "Dora Fish"],
      ["07:30", 60, "Power Flow (All Levels)", "Remi Chiovaro"],
      ["09:00", 45, "Infrared Heated HIIT (All Levels)", "Jonathan Shojaie"],
      ["10:30", 60, "Infrared Heated Power Yoga (All Levels)", "Anna Argente"],
      ["12:00", 45, "Mat Pilates", "Natalie Gene"],
      ["13:30", 45, "Mat Pilates", "Natalie Gene"],
      ["16:30", 60, "Yin Yoga & Sound Bath (All Levels)", "Britt Abundant"],
      ["18:00", 60, "Power Flow (Int)", "Kyla Porcellini"],
    ],
    [
      ["07:30", 60, "Infrared Heated HIIT (All Levels)", "Cedrick Alexander"],
      ["09:00", 60, "Power Flow (All Levels)", "Kyla Porcellini"],
      ["10:30", 60, "Mat Pilates", "Kyla Porcellini"],
      ["12:00", 60, "Breath, Stretch & Sound Bath", "Daisy Mack"],
      ["13:30", 45, "Yoga Sculpt With Weights (All Levels)", "Celia Williamson"],
      ["15:00", 60, "Mat Pilates", "Sarah Bellini"],
      ["16:30", 60, "Infrared Heated Power Yoga (All Levels)", "Anna Argente"],
      ["18:00", 60, "Mat Pilates", "Anna Argente"],
      ["19:30", 60, "Power Flow (Int)", "Dora Fish"],
    ],
    [
      ["06:15", 45, "HIIT", "Cedrick Alexander"],
      ["07:30", 60, "Power Flow (All Levels)", "Remi Chiovaro"],
      ["09:00", 45, "Infrared Heated HIIT (All Levels)", "Jonathan Shojaie"],
      ["10:30", 60, "Infrared Heated Power Yoga (All Levels)", "Anna Argente"],
      ["12:00", 45, "Mat Pilates", "Natalie Gene"],
      ["13:30", 45, "Infrared Heated Power Yoga (All Levels)", "Natalie Gene"],
      ["15:00", 45, "Mat Pilates", "Elizabeth Edis"],
      ["16:30", 60, "Yin Yoga & Sound Bath (All Levels)", "Britt Abundant"],
      ["18:00", 60, "Power Flow (Int)", "Kyla Porcellini"],
      ["19:30", 60, "Power Flow & Sound Bath (Int)", "Kyla Porcellini"],
    ],
    [
      ["07:30", 60, "Yoga Sculpt With Weights (All Levels)", "Anna Argente"],
      ["09:00", 45, "Mat Pilates", "Saori Soga"],
      ["10:30", 60, "Power Flow (All Levels)", "Saori Soga"],
      ["12:00", 60, "Power Flow (Int)", "Sarah Bellini"],
      ["13:30", 45, "Mat Pilates", "Greg Peoples"],
      ["15:00", 60, "Power Flow (All Levels)", "Elizabeth Edis"],
      ["16:30", 60, "Restorative Yoga & Sound Bath", "Heather Dawn"],
    ],
    [
      ["09:00", 60, "Infrared Heated Yoga Sculpt (All Levels)", "Molly Wedgwood"],
      ["10:30", 60, "Mat Pilates", "Anna Argente"],
      ["12:00", 60, "Power Flow (Int)", "Sara Blowers"],
      ["16:00", 60, "Candlelit Yin & Piano Sound Bath", "Julie Clark"],
    ],
  ],
  scity: [
    [
      ["08:45", 45, "Infrared Heated Power Yoga (All Levels)", "Natalie Gene"],
      ["10:30", 60, "Mat Pilates", "Natalie Gene"],
      ["12:00", 75, "Kundalini Yoga & Sound Healing (All Levels)", "Jamie Sorrentini"],
      ["16:00", 60, "Power Flow (All Levels)", "Sugar Stanley"],
    ],
    [
      ["07:30", 50, "Infrared Heated Pilates Sculpt (All Levels)", "Natalie Gene"],
      ["09:00", 60, "Power Flow (All Levels)", "Jeni Villanueva"],
      ["10:30", 60, "Yoga Sculpt With Weights (All Levels)", "Molly Wedgwood"],
      ["12:00", 60, "Power Flow (All Levels)", "Jessica Greene"],
      ["13:30", 45, "Infrared Heated HIIT (All Levels)", "Monica Nordlin"],
      ["15:00", 45, "Mat Pilates", "Isabella Miller"],
      ["16:30", 60, "Power Flow (All Levels)", "Zoe Fox"],
      ["18:00", 60, "Yin Yoga & Sound Bath (All Levels)", "Melissa Genovese"],
      ["19:30", 60, "Infrared Heated Power Yoga (All Levels)", "Jeni Villanueva"],
    ],
    [
      ["07:30", 60, "Infrared Heated Yoga Sculpt (All Levels)", "Molly Wedgwood"],
      ["09:00", 45, "Infrared Heated HIIT (All Levels)", "Monica Nordlin"],
      ["10:30", 60, "Infrared Heated Power Yoga (All Levels)", "Raquel Barrantes"],
      ["12:00", 45, "Mat Pilates", "Micki Duran"],
      ["13:30", 45, "Mat Pilates", "Jessica Greene"],
      ["16:30", 60, "Infrared Heated Yin Yoga (Int)", "Patrick Minas"],
      ["18:00", 60, "Power Flow (All Levels)", "Nicolas Diiorio"],
      ["19:30", 60, "Mat Pilates", "Dora Fish"],
    ],
    [
      ["07:30", 45, "Infrared Heated HIIT (All Levels)", "Micki Duran"],
      ["09:00", 60, "Power Flow (All Levels)", "Jeni Villanueva"],
      ["10:30", 60, "Mat Pilates", "Jessica Greene"],
      ["12:00", 60, "Yin Yoga & Sound Bath (All Levels)", "Saori Soga"],
      ["13:30", 60, "Infrared Heated Self Massage: Roll & Release", "Saori Soga"],
      ["15:00", 45, "Mat Pilates", "Micki Duran"],
      ["16:30", 45, "Infrared Heated Power Yoga (All Levels)", "Zoe Fox"],
      ["18:00", 60, "Resting Kundalini & Sound Bath (All Levels)", "Melissa Genovese"],
      ["19:30", 60, "Power Flow (All Levels)", "Zoe Fox"],
    ],
    [
      ["07:30", 60, "Yoga Sculpt With Weights (All Levels)", "Molly Wedgwood"],
      ["09:00", 45, "Infrared Heated HIIT (All Levels)", "Monica Nordlin"],
      ["10:30", 60, "Infrared Heated Power Yoga (All Levels)", "Raquel Barrantes"],
      ["12:00", 45, "Mat Pilates", "Isabella Miller"],
      ["13:30", 60, "Power Flow (All Levels)", "Jessica Greene"],
      ["15:00", 60, "Mat Pilates", "Dora Fish"],
      ["16:30", 60, "Power Flow (All Levels)", "Raquel Barrantes"],
      ["18:00", 60, "Power Flow (All Levels)", "Nicolas Diiorio"],
      ["19:30", 60, "Wind-Down Flow & Sound Bath (All Levels)", "Raquel Barrantes"],
    ],
    [
      ["07:30", 50, "Infrared Heated Pilates Sculpt (All Levels)", "Natalie Gene"],
      ["09:00", 60, "Yoga Sculpt With Weights (All Levels)", "Molly Wedgwood"],
      ["10:30", 60, "Vinyasa & Yin", "Nicolas Diiorio"],
      ["12:00", 60, "Power Flow (All Levels)", "Jessica Greene"],
      ["13:30", 45, "Mat Pilates", "Jessica Greene"],
      ["15:00", 60, "Slow Flow Yoga (Beg)", "Zoe Fox"],
      ["16:30", 60, "Restorative Yoga & Meditation (All Levels)", "Rebecca Benenati"],
    ],
    [
      ["08:45", 45, "Infrared Heated HIIT (All Levels)", "Emily Jacques"],
      ["10:30", 60, "Pilates Sculpt", "Natalie Gene"],
      ["12:00", 60, "Power Flow (All Levels)", "Zoe Fox"],
      ["16:00", 60, "Calming Kundalini & Sound Bath", "Rachel SatSiri"],
    ],
  ],
};

const THERAPY_HOURS = { open: "07:00", close: "21:00" };
const TREATMENT_HOURS = { open: "09:00", close: "20:00" };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function toTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function sessionStart(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function sessionId(location: LocationId, serviceId: ServiceId, date: string, time: string): string {
  return `${location}|${serviceId}|${date}|${time}`;
}

// Simulated demand from other people so the schedule doesn't look empty.
function othersBooked(id: string, capacity: number): number {
  const h = hash(id);
  if (capacity > 1 && h % 11 === 0) return capacity;
  if (capacity === 1) return h % 3 === 0 ? 1 : 0;
  return Math.floor(((h % 1000) / 1000) * capacity * 0.8);
}

export function classesOn(location: LocationId, date: string): Session[] {
  const rows = WEEK[location][sessionStart(date, "12:00").getDay()];
  const capacity = SERVICES.class.capacity;
  return rows.map(([time, durationMin, title, instructor]) => {
    const id = sessionId(location, "class", date, time);
    return { id, serviceId: "class", location, date, time, durationMin, title, instructor, capacity, bookedByOthers: othersBooked(id, capacity) };
  });
}

// How often a service can start, and how many minutes past the opening hour the first start is.
// Cryo: every 5 min. Sauna: every hour at :20 (e.g. 4:20–5:05 PM). Float: every 90 min (45-min sessions).
const SLOT_RULES: Partial<Record<ServiceId, { every: number; offset: number }>> = {
  cryo: { every: 5, offset: 0 },
  "ir-sauna": { every: 60, offset: 20 },
  "red-light": { every: 30, offset: 0 },
  float: { every: 90, offset: 0 },
};
const DEFAULT_SLOT_RULE = { every: 60, offset: 0 };

// Ticketed events hosted by this location on this date, as bookable sessions.
export function eventSessions(location: LocationId, date: string): Session[] {
  return EVENTS.filter((e) => e.ticket && e.host === location && e.date === date).map((e) => {
    const id = sessionId(location, "event", date, e.time);
    return {
      id,
      serviceId: "event",
      location,
      date,
      time: e.time,
      durationMin: e.durationMin,
      title: e.title,
      instructor: e.venue.startsWith("ARTHA") ? undefined : e.venue, // shown only for off-site venues
      capacity: e.ticket!.capacity,
      bookedByOthers: othersBooked(id, e.ticket!.capacity),
    };
  });
}

export function slotsFor(location: LocationId, serviceId: ServiceId, date: string): Session[] {
  const service = SERVICES[serviceId];
  if (!service.locations.includes(location)) return [];
  if (serviceId === "class") return classesOn(location, date);
  if (serviceId === "event") return eventSessions(location, date);
  const hours = service.category === "treatment" ? TREATMENT_HOURS : THERAPY_HOURS;
  const rule = SLOT_RULES[serviceId] ?? DEFAULT_SLOT_RULE;
  const out: Session[] = [];
  for (let m = toMinutes(hours.open) + rule.offset; m + service.durationMin <= toMinutes(hours.close); m += rule.every) {
    const time = toTime(m);
    const id = sessionId(location, serviceId, date, time);
    out.push({
      id,
      serviceId,
      location,
      date,
      time,
      durationMin: service.durationMin,
      title: service.name,
      instructor: service.category === "treatment" ? pickTherapist(serviceId, `${location}${date}${time}`) : undefined,
      capacity: service.capacity,
      bookedByOthers: othersBooked(id, service.capacity),
    });
  }
  return out;
}

function pickTherapist(serviceId: ServiceId, seed: string): string {
  const options = therapistsFor(serviceId);
  return options[hash(seed) % options.length].name;
}

export function findSession(id: string): Session | undefined {
  const [location, serviceId, date, time] = id.split("|") as [LocationId, ServiceId, string, string];
  if (!SERVICES[serviceId]) return undefined;
  return slotsFor(location, serviceId, date).find((s) => s.time === time);
}

export function upcomingDays(count: number, from = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    return dateKey(d);
  });
}
