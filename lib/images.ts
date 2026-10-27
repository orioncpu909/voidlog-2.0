// Photos for the Book tab's therapy and treatment pages (classes have none). These are free Unsplash photos
// (unsplash.com/license), loaded from Unsplash. Swap in ARTHA's own photos by dropping files in
// /public/images and pointing these at "/images/<file>".
import { ServiceId } from "./data";

const unsplash = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

// One photo per therapy and treatment, shown at the top of its page in Book.
export const SERVICE_IMAGE: Partial<Record<ServiceId, string>> = {
  cryo: unsplash("photo-1517299321609-52687d1bc55a"), // frost
  "ir-sauna": unsplash("photo-1572168400468-62e1b3209d7d"), // sauna benches
  "red-light": unsplash("photo-1500462918059-b1a0cb512f1d"), // red light
  contrast: unsplash("photo-1583416750470-965b2707b355"), // steam room
  float: unsplash("photo-1474557157379-8aa74a6ef541"), // lotus on still water
  hbot: unsplash("photo-1550684848-fac1c5b4e853"), // bubbles
  massage: unsplash("photo-1544161515-4ab6ce6db874"),
  "em-sculpt": unsplash("photo-1512290923902-8a9f81dc236c"),
  "thermal-shock": unsplash("photo-1600334089648-b0d9d3028eb2"),
  "cryo-facial": unsplash("photo-1570172619644-dfd03ed5d881"),
  event: unsplash("photo-1544367567-0f2fcb009e0b"),
};
