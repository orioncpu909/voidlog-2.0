// Therapists shown under Treatments → "Meet your therapists", and assigned to treatment times.
// CONFIRM: specialties and bios are placeholders. Replace them with each therapist's own words.
import { ServiceId } from "./data";

export interface Therapist {
  name: string;
  specialties: string[];
  bio: string;
  services: ServiceId[]; // treatments they can be booked for
}

export const THERAPISTS: Therapist[] = [
  {
    name: "Christian",
    specialties: ["Deep tissue", "Sports recovery"],
    bio: "Christian focuses on deep tissue and sports recovery work, releasing tight, overworked muscles so you move and recover better.",
    services: ["massage"],
  },
  {
    name: "Tiffany",
    specialties: ["Body sculpting", "Skin treatments"],
    bio: "Tiffany leads ARTHA's body and skin treatments, from EM BodySculpting to cryo-facials, tailoring every session to your goals.",
    services: ["em-sculpt", "thermal-shock", "cryo-facial", "massage"],
  },
  {
    name: "Victor",
    specialties: ["Relaxation", "Lymphatic drainage"],
    bio: "Victor's slow, restorative style centers on relaxation and lymphatic drainage. Ideal for stress relief and a full reset.",
    services: ["massage"],
  },
];

export function therapistsFor(serviceId: ServiceId): Therapist[] {
  const t = THERAPISTS.filter((x) => x.services.includes(serviceId));
  return t.length ? t : THERAPISTS;
}
