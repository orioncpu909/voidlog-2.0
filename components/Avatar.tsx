import clsx from "clsx";

// A member's photo, or the first letter of their name until they add one.
export function Avatar({ name, photo, className }: { name: string; photo?: string; className?: string }) {
  return (
    <span className={clsx("flex items-center justify-center overflow-hidden rounded-full border border-line bg-card font-serif text-shell", className)}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        Array.from(name.trim())[0]?.toUpperCase()
      )}
    </span>
  );
}
