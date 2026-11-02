import { useId } from "react";

// The streak's flame: a deep red outer flame, a brighter layer inside it and a hot core, with a
// lick of light up one side for texture.
export function StreakFlame({ size = 20, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-outer`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#E0301E" />
          <stop offset="0.6" stopColor="#C4161C" />
          <stop offset="1" stopColor="#8E0F16" />
        </linearGradient>
        <linearGradient id={`${id}-inner`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#F2542A" />
          <stop offset="1" stopColor="#D92A1E" />
        </linearGradient>
        <linearGradient id={`${id}-core`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#FFC24D" />
          <stop offset="1" stopColor="#F47A2B" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id}-outer)`}
        d="M12 1.5c.6 3.2 2.2 4.9 3.9 6.7 2 2.1 3.9 4.4 3.9 7.6A7.8 7.8 0 0 1 12 23.5a7.8 7.8 0 0 1-7.8-7.7c0-2.6 1.2-4.6 2.7-6.2.3 1.6 1 2.7 2.2 3.4C8.8 8.6 9.6 4.4 12 1.5Z"
      />
      <path fill="none" stroke="#F26A3D" strokeOpacity="0.7" strokeWidth="0.7" strokeLinecap="round" d="M6.2 15.2c-.1-1.5.4-2.8 1.2-3.9M16.2 10.4c1.2 1.3 2 2.7 2.1 4.4" />
      <path
        fill={`url(#${id}-inner)`}
        d="M12.4 9.6c.4 1.9 1.4 3 2.4 4.2 1 1.2 2 2.4 2 4.2a4.9 4.9 0 0 1-9.8 0c0-1.5.7-2.7 1.6-3.7.2.9.7 1.6 1.4 2-.4-2.3.6-4.9 2.4-6.7Z"
      />
      <path
        fill={`url(#${id}-core)`}
        d="M12.2 15c.3 1 .9 1.6 1.4 2.3.5.6.9 1.2.9 2a2.5 2.5 0 0 1-5 0c0-1.2.9-2.1 1.7-2.8.1.4.3.7.6.9-.1-.8 0-1.6.4-2.4Z"
      />
    </svg>
  );
}
