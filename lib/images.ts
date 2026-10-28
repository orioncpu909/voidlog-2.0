// Service photos. Book no longer shows them (it's text only); the sign-up screen uses the event photo. Free Unsplash photos
// (unsplash.com/license), loaded from Unsplash. Swap in ARTHA's own photos by dropping files in
// /public/images and pointing these at "/images/<file>".
import { ServiceId } from "./data";

const unsplash = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

// One photo per therapy and treatment, kept in case photos come back to Book.
export const SERVICE_IMAGE: Partial<Record<ServiceId, string>> = {
  cryo: unsplash("photo-1517299321609-52687d1bc55a"), // frost
  "ir-sauna": unsplash("photo-1572168400468-62e1b3209d7d"), // sauna benches
  "red-light": unsplash("photo-1500462918059-b1a0cb512f1d"), // red light
  contrast: unsplash("photo-1583416750470-965b2707b355"), // steam room
  float: unsplash("photo-1474557157379-8aa74a6ef541"), // lotus on still water
  hbot: unsplash("photo-1550684848-fac1c5b4e853"), // bubbles
  massage: unsplash("photo-1544161515-4ab6ce6db874"),
  "em-sculpt": unsplash("photo-1512290923902-8a9f81dc236c"),
  "cryo-facial": unsplash("photo-1570172619644-dfd03ed5d881"),
  "thermal-shock": unsplash("photo-1600334089648-b0d9d3028eb2"),
  endermologie: unsplash("photo-1519824145371-296894a0daa9"), // hands-on body treatment
  event: unsplash("photo-1544367567-0f2fcb009e0b"),
};
