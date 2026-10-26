// Fitness apps a member can connect to track steps. In this web demo the connection and the
// step counts are simulated. Real connections need:
// - Apple Health: a native iPhone app using HealthKit (there is no web API).
// - Strava, WHOOP, Garmin: a developer account with each, plus a server for their OAuth sign-in.
//   Strava shares workouts (walks, runs, rides) rather than an all-day step count, so steps from
//   Strava would be estimated from walk and run distance.

export type ProviderId = "apple-health" | "garmin" | "whoop" | "strava";

export interface Provider {
  id: ProviderId;
  name: string;
  shares: string; // what ARTHA would read, in plain words
}

export const PROVIDERS: Provider[] = [
  { id: "apple-health", name: "Apple Health", shares: "Daily steps" },
  { id: "garmin", name: "Garmin Connect", shares: "Daily steps" },
  { id: "whoop", name: "WHOOP", shares: "Daily steps and activity" },
  { id: "strava", name: "Strava", shares: "Walks and runs, counted as steps" },
];

// With more than one app connected, steps come from the first connected one in this order, so
// the same walk is never counted twice.
export const STEP_PRIORITY: ProviderId[] = ["apple-health", "garmin", "whoop", "strava"];

export const STEP_GOAL = 10000;

export function stepSource(connected: ProviderId[]): Provider | undefined {
  const id = STEP_PRIORITY.find((p) => connected.includes(p));
  return PROVIDERS.find((p) => p.id === id);
}

// Demo step counts: stable for a given account and day, a little higher on days with a visit.
export function demoSteps(seed: string, date: string, visited: boolean): number {
  let h = 2166136261;
  for (const c of `${seed}|${date}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const base = 4200 + ((h >>> 0) % 7800);
  return Math.round((base + (visited ? 2600 : 0)) / 10) * 10;
}
