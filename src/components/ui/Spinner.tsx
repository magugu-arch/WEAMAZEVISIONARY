/** Square-terminal progress arc (no rounded caps, per CI geometry). */
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="animate-spin motion-reduce:animate-none">
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M8 1.5 A6.5 6.5 0 0 1 14.5 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="butt" />
    </svg>
  );
}
