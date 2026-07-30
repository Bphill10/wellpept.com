import { useEffect, useMemo, useRef } from "react";

const TUNE_MS = 6800;
const REVEAL_MS = 4200; // swap to Undisclosed under solid overlay before fade-out
const REDUCED_MS = 160;
const FLAKE_COUNT = 72;

function makeFlakes(count) {
  return Array.from({ length: count }, (_, i) => {
    const size = 3 + ((i * 19) % 34);
    return {
      id: i,
      left: `${(i * 37 + 13) % 100}%`,
      top: `${(i * 53 + 7) % 100}%`,
      size,
      delay: `${((i * 97) % 1200) / 1000}s`,
      duration: `${1.8 + ((i * 41) % 260) / 100}s`,
      blur: size > 20 ? 3.2 : size > 12 ? 1.6 : 0.7,
      opacity: 0.2 + ((i * 13) % 60) / 100,
    };
  });
}

function makeNoiseBuffer(ctx, seconds = 2) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const n = Math.random() * 2 - 1;
    const crackle = Math.random() > 0.993 ? (Math.random() * 2 - 1) * 1.6 : 0;
    data[i] = n * 0.7 + crackle;
  }
  return buffer;
}

/**
 * Original eerie dimension-shift score + TV static.
 * (Inspired by classic late-night sci-fi TV mood — not a licensed theme.)
 */
function startTwilightAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return () => {};

  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const end = now + TUNE_MS / 1000;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.85, now + 0.25);
  master.gain.setValueAtTime(0.85, end - 0.7);
  master.gain.exponentialRampToValueAtTime(0.0001, end);
  master.connect(ctx.destination);

  // --- TV static bed ---
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = makeNoiseBuffer(ctx, 2);
  noiseSrc.loop = true;
  const noiseHp = ctx.createBiquadFilter();
  noiseHp.type = "highpass";
  noiseHp.frequency.value = 220;
  const noisePeak = ctx.createBiquadFilter();
  noisePeak.type = "peaking";
  noisePeak.frequency.value = 2400;
  noisePeak.Q.value = 0.6;
  noisePeak.gain.value = 5;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.16, now + 0.2);
  // swell mid-transition then settle
  noiseGain.gain.linearRampToValueAtTime(0.28, now + 2.2);
  noiseGain.gain.linearRampToValueAtTime(0.12, now + 4.5);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, end);
  noiseSrc.connect(noiseHp);
  noiseHp.connect(noisePeak);
  noisePeak.connect(noiseGain);
  noiseGain.connect(master);

  // --- Deep dimension drone ---
  const drone = ctx.createOscillator();
  drone.type = "sawtooth";
  drone.frequency.setValueAtTime(55, now);
  drone.frequency.linearRampToValueAtTime(48, end);
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.setValueAtTime(180, now);
  droneFilter.frequency.linearRampToValueAtTime(90, end);
  droneFilter.Q.value = 4;
  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0.0001, now);
  droneGain.gain.exponentialRampToValueAtTime(0.12, now + 0.8);
  droneGain.gain.setValueAtTime(0.12, end - 0.8);
  droneGain.gain.exponentialRampToValueAtTime(0.0001, end);
  drone.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(master);

  // Sub pulse (slow, uneasy)
  const pulse = ctx.createOscillator();
  pulse.type = "sine";
  pulse.frequency.value = 36;
  const pulseGain = ctx.createGain();
  pulseGain.gain.setValueAtTime(0, now);
  // Soft heart-ish swells
  for (let t = now + 0.6; t < end - 0.9; t += 1.15) {
    pulseGain.gain.setValueAtTime(0.001, t);
    pulseGain.gain.linearRampToValueAtTime(0.09, t + 0.18);
    pulseGain.gain.linearRampToValueAtTime(0.001, t + 0.55);
  }
  pulse.connect(pulseGain);
  pulseGain.connect(master);

  // --- Theremin-like lead (original contour — mysterious, not a cover) ---
  const lead = ctx.createOscillator();
  lead.type = "sine";
  const leadGain = ctx.createGain();
  leadGain.gain.setValueAtTime(0.0001, now);
  leadGain.gain.exponentialRampToValueAtTime(0.11, now + 1.0);

  // Slow vibrato
  const vib = ctx.createOscillator();
  vib.type = "sine";
  vib.frequency.value = 4.2;
  const vibDepth = ctx.createGain();
  vibDepth.gain.value = 7;
  vib.connect(vibDepth);
  vibDepth.connect(lead.frequency);

  // Original eerie contour (Hz) — descending / floating, original path
  const melody = [
    [0.9, 392],
    [1.6, 349],
    [2.2, 415],
    [2.9, 311],
    [3.6, 370],
    [4.3, 277],
    [5.0, 330],
    [5.7, 247],
  ];
  melody.forEach(([at, freq]) => {
    lead.frequency.setValueAtTime(freq, now + at);
  });
  leadGain.gain.setValueAtTime(0.11, end - 1.0);
  leadGain.gain.exponentialRampToValueAtTime(0.0001, end);

  const leadFilter = ctx.createBiquadFilter();
  leadFilter.type = "lowpass";
  leadFilter.frequency.value = 1800;
  lead.connect(leadFilter);
  leadFilter.connect(leadGain);
  leadGain.connect(master);

  // Ghost harmony (fifth below, quieter)
  const ghost = ctx.createOscillator();
  ghost.type = "triangle";
  ghost.frequency.setValueAtTime(196, now + 1.2);
  ghost.frequency.linearRampToValueAtTime(165, now + 4.5);
  const ghostGain = ctx.createGain();
  ghostGain.gain.setValueAtTime(0.0001, now);
  ghostGain.gain.exponentialRampToValueAtTime(0.045, now + 1.5);
  ghostGain.gain.exponentialRampToValueAtTime(0.0001, end);
  ghost.connect(ghostGain);
  ghostGain.connect(master);

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  noiseSrc.start();
  drone.start();
  pulse.start();
  lead.start();
  vib.start();
  ghost.start();

  const nodes = [noiseSrc, drone, pulse, lead, vib, ghost];

  return () => {
    try {
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* ignore */
        }
      });
      ctx.close();
    } catch {
      /* ignore */
    }
  };
}

/**
 * Twilight-dimension CRT wipe — WellPept → Undisclosed (5 logo taps).
 * Calls onReveal while the overlay is still fully opaque, then onDone after fade.
 */
export default function ChannelTuneOverlay({ active, onReveal, onDone }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;
  const finishedRef = useRef(false);
  const revealedRef = useRef(false);
  const flakes = useMemo(() => makeFlakes(FLAKE_COUNT), []);

  useEffect(() => {
    if (!active) {
      finishedRef.current = false;
      revealedRef.current = false;
      return undefined;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    let stopAudio = () => {};
    if (!reduced) {
      try {
        stopAudio = startTwilightAudio();
      } catch {
        stopAudio = () => {};
      }
    }

    const revealAt = reduced ? 40 : REVEAL_MS;
    const doneAt = reduced ? REDUCED_MS : TUNE_MS;

    const revealTimer = window.setTimeout(() => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      onRevealRef.current?.();
    }, revealAt);

    const doneTimer = window.setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (!revealedRef.current) {
        revealedRef.current = true;
        onRevealRef.current?.();
      }
      stopAudio();
      onDoneRef.current?.();
    }, doneAt);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
      stopAudio();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="tv-tune tv-tune--twilight"
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
        <div className="tv-tune-matte" />
        <div className="tv-tune-void" />
        <div className="tv-tune-spiral" />
        <div className="tv-tune-doorway" />

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

        <div className="tv-tune-titlecard">
          <p className="tv-tune-epigraph">Submitted for your approval</p>
          <h2 className="tv-tune-dimension">Another dimension</h2>
          <p className="tv-tune-tagline">of sight · of sound · of mind</p>
        </div>

        <div className="tv-tune-hud">
          <div className="tv-tune-hud-row">
            <span className="tv-tune-ch">CH</span>
            <span className="tv-tune-ch-num">02</span>
          </div>
          <p className="tv-tune-from">WELLPEPT</p>
          <p className="tv-tune-name">UNDISCLOSED</p>
          <p className="tv-tune-signal">
            <span />
            ENTERING · SIGNAL LOCK
          </p>
          <p className="tv-tune-mhz">···· DIMENSION SHIFT ····</p>
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
