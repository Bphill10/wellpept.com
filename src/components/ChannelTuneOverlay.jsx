import { useEffect, useMemo, useRef } from "react";

const TUNE_MS = 4800;
const REDUCED_MS = 160;
const FLAKE_COUNT = 56;

function makeFlakes(count) {
  return Array.from({ length: count }, (_, i) => {
    const size = 4 + ((i * 17) % 28);
    return {
      id: i,
      left: `${(i * 37 + 13) % 100}%`,
      top: `${(i * 53 + 7) % 100}%`,
      size,
      delay: `${((i * 97) % 900) / 1000}s`,
      duration: `${1.6 + ((i * 41) % 220) / 100}s`,
      blur: size > 18 ? 2.5 : size > 10 ? 1.4 : 0.6,
      opacity: 0.25 + ((i * 13) % 55) / 100,
    };
  });
}

/** Generate looping white-noise / TV static via Web Audio. */
function startStaticAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return () => {};

  const ctx = new AudioCtx();
  const seconds = 2;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    // Harsh TV snow + occasional crackle spikes
    const n = Math.random() * 2 - 1;
    const crackle = Math.random() > 0.992 ? (Math.random() * 2 - 1) * 1.8 : 0;
    data[i] = n * 0.72 + crackle;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 180;

  const band = ctx.createBiquadFilter();
  band.type = "peaking";
  band.frequency.value = 2200;
  band.Q.value = 0.7;
  band.gain.value = 6;

  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.24, now + 0.15);
  // Fluttering reception
  const end = now + TUNE_MS / 1000;
  let t = now + 0.2;
  while (t < end - 0.7) {
    const peak = 0.16 + Math.random() * 0.12;
    gain.gain.linearRampToValueAtTime(peak, t);
    t += 0.12 + Math.random() * 0.18;
  }
  gain.gain.linearRampToValueAtTime(0.2, end - 0.55);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  source.connect(highpass);
  highpass.connect(band);
  band.connect(gain);
  gain.connect(ctx.destination);

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  source.start();

  return () => {
    try {
      source.stop();
      ctx.close();
    } catch {
      /* ignore */
    }
  };
}

/**
 * Long B&W CRT static wipe — WellPept → Undisclosed (5 logo taps).
 */
export default function ChannelTuneOverlay({ active, onDone }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finishedRef = useRef(false);
  const flakes = useMemo(() => makeFlakes(FLAKE_COUNT), []);

  useEffect(() => {
    if (!active) {
      finishedRef.current = false;
      return undefined;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    let stopAudio = () => {};
    if (!reduced) {
      try {
        stopAudio = startStaticAudio();
      } catch {
        stopAudio = () => {};
      }
    }

    const ms = reduced ? REDUCED_MS : TUNE_MS;
    const t = window.setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      stopAudio();
      onDoneRef.current?.();
    }, ms);

    return () => {
      window.clearTimeout(t);
      stopAudio();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="tv-tune"
      role="presentation"
      aria-hidden="true"
      style={{ "--tv-tune-dur": `${TUNE_MS}ms` }}
    >
      <svg className="tv-tune-svg" aria-hidden="true">
        <filter id="tv-noise-filter" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            stitchTiles="stitch"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              values="0.65;1.25;0.5;1.05;0.85"
              dur="0.22s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0"
          />
        </filter>
      </svg>

      <div className="tv-tune-screen">
        <div className="tv-tune-void" />
        <div className="tv-tune-noise" />
        <div className="tv-tune-snow" />
        <div className="tv-tune-snow tv-tune-snow--coarse" />
        <div className="tv-tune-snow tv-tune-snow--soft" />

        <div className="tv-tune-flakes">
          {flakes.map((f) => (
            <span
              key={f.id}
              className="tv-tune-flake"
              style={{
                left: f.left,
                top: f.top,
                width: f.size,
                height: f.size,
                animationDelay: f.delay,
                animationDuration: f.duration,
                filter: `blur(${f.blur}px)`,
                opacity: f.opacity,
              }}
            />
          ))}
        </div>

        <div className="tv-tune-bars" aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span />
        </div>

        <div className="tv-tune-glitch">
          <span /><span /><span /><span />
        </div>

        <div className="tv-tune-roll" />
        <div className="tv-tune-tear" />
        <div className="tv-tune-scanlines" />
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
            NO SIGNAL · TUNING
          </p>
          <p className="tv-tune-mhz">···· STATIC ····</p>
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
