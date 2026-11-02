// Profile photos stay on this device with the rest of the demo data, so a camera-roll picture is
// cropped to a small square first: phone photos are far too big for the browser's storage.
const PHOTO_SIZE = 256; // px, sharp at the largest size it's shown on a phone
const PHOTO_QUALITY = 0.85;

export async function shrinkPhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = PHOTO_SIZE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No canvas");
    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
    return canvas.toDataURL("image/jpeg", PHOTO_QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}
