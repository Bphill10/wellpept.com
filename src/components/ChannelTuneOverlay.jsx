import { useEffect, useRef } from "react";

/**
 * Old CRT channel-tune wipe used when unlocking Undisclosed via 5 logo taps.
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

    const ms = reduced ? 120 : 1680;
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
      <div className="tv-tune-snow" />
      <div className="tv-tune-scanlines" />
      <div className="tv-tune-roll" />
      <div className="tv-tune-bars" />
      <div className="tv-tune-flare" />
      <div className="tv-tune-hud">
        <span className="tv-tune-ch">CH 02</span>
        <span className="tv-tune-name">UNDISCLOSED</span>
        <span className="tv-tune-signal">···· TUNING ····</span>
      </div>
      <div className="tv-tune-vignette" />
    </div>
  );
}
