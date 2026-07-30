import { useEffect, useRef } from "react";

/**
 * Cinematic CRT channel-tune wipe — WellPept → Undisclosed (5 logo taps).
 */
export default function ChannelTuneOverlay({ active, onDone }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      finishedRef.current = false;
      return undefined;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const ms = reduced ? 140 : 2400;
    const t = window.setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onDoneRef.current?.();
    }, ms);
    return () => window.clearTimeout(t);
  }, [active]);

  if (!active) return null;

  return (
    <div className="tv-tune" role="presentation" aria-hidden="true">
      <svg className="tv-tune-svg" aria-hidden="true">
        <filter id="tv-noise-filter" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="4"
            stitchTiles="stitch"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              values="0.7;1.1;0.55;0.95;0.8"
              dur="0.35s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.9 0"
          />
        </filter>
      </svg>

      <div className="tv-tune-screen">
        <div className="tv-tune-snow" />
        <div className="tv-tune-snow tv-tune-snow--r" />
        <div className="tv-tune-snow tv-tune-snow--b" />
        <div className="tv-tune-noise" />

        <div className="tv-tune-bars" aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span />
          <i /><i /><i /><i /><i /><i /><i /><i />
        </div>

        <div className="tv-tune-glitch">
          <span /><span /><span /><span />
        </div>

        <div className="tv-tune-roll" />
        <div className="tv-tune-tear" />
        <div className="tv-tune-scanlines" />
        <div className="tv-tune-phosphor" />
        <div className="tv-tune-beam" />

        <div className="tv-tune-hud">
          <div className="tv-tune-hud-row">
            <span className="tv-tune-ch">CH</span>
            <span className="tv-tune-ch-num">02</span>
          </div>
          <p className="tv-tune-from">WELLPEPT</p>
          <p className="tv-tune-name">UNDISCLOSED</p>
          <p className="tv-tune-signal">
            <span />
            SIGNAL LOCK
          </p>
          <p className="tv-tune-mhz">471.25 MHz · NTSC</p>
        </div>

        <div className="tv-tune-corner tv-tune-corner--tl" />
        <div className="tv-tune-corner tv-tune-corner--tr" />
        <div className="tv-tune-corner tv-tune-corner--bl" />
        <div className="tv-tune-corner tv-tune-corner--br" />

        <div className="tv-tune-vignette" />
        <div className="tv-tune-glass" />
        <div className="tv-tune-cut" />
      </div>
    </div>
  );
}
