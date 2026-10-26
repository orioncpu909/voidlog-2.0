// Photos behind the Book tiles. These are free Unsplash photos (unsplash.com/license), loaded
// from Unsplash. Swap in ARTHA's own photos by dropping files in /public/images and pointing
// these at "/images/<file>".
import { Category } from "./data";

const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=70`;

export const CATEGORY_IMAGE: Record<Category, { src: string; alt: string }> = {
  class: { src: unsplash("photo-1544367567-0f2fcb009e0b"), alt: "Yoga at sunset" },
  therapy: { src: unsplash("photo-1572168400468-62e1b3209d7d"), alt: "Wooden sauna benches" },
  treatment: { src: unsplash("photo-1519823551278-64ac92734fb1"), alt: "Massage treatment" },
  event: { src: unsplash("photo-1544367567-0f2fcb009e0b"), alt: "Yoga at sunset" },
};
