import { SERVICES } from "./data";

// Short descriptions for each class on the schedule, matched from the class title: what the class
// is, then whether it's heated and who it's for. CONFIRM: demo copy written from the class names,
// not from artha.la; replace with ARTHA's own descriptions.
const STYLES: [RegExp, string][] = [
  [/Yoga Sculpt/, "Vinyasa yoga with light hand weights to build strength and tone."],
  [/Pilates Sculpt/, "Mat Pilates with light weights and resistance for a full-body burn."],
  [/Mat Pilates/, "Low-impact mat Pilates focused on core strength, posture and control."],
  [/HIIT/, "High-intensity intervals of strength and cardio to get your heart rate up."],
  [/Wind-Down Flow & Sound Bath/, "A gentle evening flow to unwind, ending in a sound bath."],
  [/Power Flow & Sound Bath/, "A strong vinyasa flow that ends in a sound bath to settle body and mind."],
  [/Power Flow/, "A strong, steady vinyasa flow linking breath and movement to build heat and strength."],
  [/Power Yoga/, "An athletic, fast-moving yoga practice to build strength and heat."],
  [/Slow Flow/, "An unhurried vinyasa flow with time to learn the shapes and the breath."],
  [/Vinyasa & Yin/, "Half active vinyasa, half long-held yin stretches to finish."],
  [/Candlelit Yin & Piano/, "Long, supported yin holds by candlelight, with live piano."],
  [/Yin Yoga & Sound Bath/, "Slow, long-held yin poses for a deep stretch, closing with a sound bath."],
  [/Yin Yoga/, "Slow, long-held floor poses that release deep connective tissue."],
  [/Kundalini/, "Breathwork, movement and mantra to energize and clear the mind, ending in sound healing."],
  [/Restorative Yoga & Meditation/, "Fully supported, restful poses with props, followed by a guided meditation."],
  [/Restorative Yoga & Sound Bath/, "Fully supported, restful poses with props while sound bowls play."],
  [/Breath, Stretch & Sound Bath/, "Guided breathwork and gentle stretching, then lie back for a sound bath."],
  [/Self Massage/, "Balls and rollers to release tight muscles and fascia."],
];

const LEVELS: [RegExp, string][] = [
  [/\(All Levels\)/, "Open to all levels."],
  [/\(Int\)/, "For students with some experience."],
  [/\(Beg\)/, "Beginner friendly."],
];

export function classDescription(title: string): string {
  const style = STYLES.find(([re]) => re.test(title))?.[1] ?? SERVICES.class.description;
  const heat = /Infrared Heated/.test(title) ? "Held under infrared heat panels for a deeper sweat." : "";
  const level = LEVELS.find(([re]) => re.test(title))?.[1] ?? "";
  return [style, heat, level].filter(Boolean).join(" ");
}
