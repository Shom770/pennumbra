interface LogoProps {
  /** Font size in px; the sun and horizon scale off it. */
  size?: number;
  className?: string;
}

/**
 * Wordmark: "penn" carries the pun in gold, and the period is a sun setting into
 * the tail of the word, with the horizon cutting across the letterforms.
 * Hovering lifts the sun — sunrise on the way in, back down on the way out.
 */
export default function Logo({ size = 26, className = "" }: LogoProps) {
  return (
    <span
      className={`group relative inline-flex items-end leading-none ${className}`}
      style={{
        fontFamily: "var(--font-bricolage), sans-serif",
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "-0.5px",
        paddingBottom: size * 0.16,
      }}
    >
      {/* horizon — behind the glyphs, so the word stands in front of it. Gradients
          can't be transitioned, so the two states are stacked and cross-faded. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-[.8em] -right-[.18em] bottom-[.34em] z-0 h-[2px] origin-right -rotate-[2deg]"
      >
        <span className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,209,102,.3)_34%,rgba(255,209,102,.95)_100%)] transition-opacity duration-150 ease-out group-hover:opacity-0" />
        <span className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,209,102,.5)_28%,#ffd166_100%)] opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100" />
      </span>

      <span className="relative z-10">
        <span style={{ color: "#ffd166" }}>penn</span>umbra
      </span>

      {/* the sun, setting into the tail of the word */}
      <span className="relative z-0 ml-[.2em] mb-[.18em] inline-flex items-end">
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-[.3em] left-1/2 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,209,102,.55)_0%,rgba(255,209,102,.18)_45%,transparent_72%)] opacity-80 blur-[3px] transition-opacity duration-150 ease-out group-hover:opacity-100"
          style={{ width: size * 1.05, height: size * 1.05 }}
        />
        <svg
          aria-hidden
          viewBox="0 0 20 13"
          fill="none"
          className="relative -rotate-[2deg] overflow-visible transition-transform duration-150 ease-out group-hover:-translate-y-[2px]"
          style={{ width: size * 0.72, height: size * 0.47 }}
        >
          {/* rays */}
          <g stroke="#ffd166" strokeWidth="1.5" strokeLinecap="round" opacity=".85">
            <path d="M10 0v2.4" />
            <path d="M2.1 3.1 3.8 4.8" />
            <path d="M17.9 3.1 16.2 4.8" />
          </g>
          {/* the disc, cut off at the horizon */}
          <path d="M3 13a7 7 0 0 1 14 0Z" fill="#ffd166" />
        </svg>
      </span>
    </span>
  );
}
