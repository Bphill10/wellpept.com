import { useEffect, useRef } from "react";
import { UD_LABEL_BRAND } from "../data/udLabelAssets";

const TUNE_MS = 5200;
const REVEAL_MS = 1480;
const REDUCED_MS = 160;

const GLASS_SHARDS = [
  { clip: "polygon(0 0, 24% 0, 19% 24%, 0 31%)", x: -18, y: 118, r: -24, d: 0 },
  { clip: "polygon(24% 0, 48% 0, 50% 22%, 19% 24%)", x: -7, y: 126, r: 16, d: 70 },
  { clip: "polygon(48% 0, 73% 0, 68% 28%, 50% 22%)", x: 8, y: 116, r: -13, d: 30 },
  { clip: "polygon(73% 0, 100% 0, 100% 30%, 68% 28%)", x: 19, y: 128, r: 26, d: 100 },
  { clip: "polygon(0 31%, 19% 24%, 31% 47%, 0 55%)", x: -22, y: 124, r: 19, d: 90 },
  { clip: "polygon(19% 24%, 50% 22%, 49% 48%, 31% 47%)", x: -8, y: 136, r: -29, d: 10 },
  { clip: "polygon(50% 22%, 68% 28%, 72% 51%, 49% 48%)", x: 10, y: 122, r: 24, d: 120 },
  { clip: "polygon(68% 28%, 100% 30%, 100% 55%, 72% 51%)", x: 23, y: 132, r: -18, d: 45 },
  { clip: "polygon(0 55%, 31% 47%, 24% 76%, 0 73%)", x: -20, y: 126, r: -16, d: 130 },
  { clip: "polygon(31% 47%, 49% 48%, 52% 74%, 24% 76%)", x: -6, y: 142, r: 28, d: 55 },
  { clip: "polygon(49% 48%, 72% 51%, 78% 77%, 52% 74%)", x: 7, y: 132, r: -25, d: 145 },
  { clip: "polygon(72% 51%, 100% 55%, 100% 77%, 78% 77%)", x: 20, y: 124, r: 17, d: 25 },
  { clip: "polygon(0 73%, 24% 76%, 28% 100%, 0 100%)", x: -17, y: 120, r: 22, d: 75 },
  { clip: "polygon(24% 76%, 52% 74%, 49% 100%, 28% 100%)", x: -5, y: 130, r: -20, d: 155 },
  { clip: "polygon(52% 74%, 78% 77%, 73% 100%, 49% 100%)", x: 9, y: 138, r: 15, d: 40 },
  { clip: "polygon(78% 77%, 100% 77%, 100% 100%, 73% 100%)", x: 18, y: 122, r: -27, d: 115 },
];

const GLASS_SPLINTERS = Array.from({ length: 34 }, (_, index) => {
  const angle = (index / 34) * Math.PI * 2 + (index % 3) * 0.17;
  const distance = 26 + (index % 8) * 7;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance + 82 + (index % 5) * 5,
    r: -150 + ((index * 83) % 300),
    d: 20 + ((index * 47) % 420),
    w: 3 + (index % 4) * 1.7,
    h: 0.7 + (index % 3) * 0.55,
  };
});

export { TUNE_MS };

function makeNoiseBuffer(ctx, seconds = 2.5) {
  const buffer = ctx.createBuffer(
    1,
    Math.floor(ctx.sampleRate * seconds),
    ctx.sampleRate
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const n = Math.random() * 2 - 1;
    // Phone speaker hash: sparse crackle + occasional bit crush
    const crackle = Math.random() > 0.991 ? (Math.random() * 2 - 1) * 2.2 : 0;
    const crush = Math.random() > 0.996 ? Math.sign(n) * 0.95 : 0;
    const dropout = Math.random() > 0.9985 ? 0 : 1;
    data[i] = (n * 0.5 + crackle + crush) * dropout;
  }
  return buffer;
}

function beep(ctx, master, { t, freq = 880, dur = 0.04, gain = 0.08, type = "square" }) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function whoosh(ctx, master, t, dur = 0.55, gain = 0.16) {
  const o = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(90, t);
  o.frequency.exponentialRampToValueAtTime(420, t + dur * 0.45);
  o.frequency.exponentialRampToValueAtTime(40, t + dur);
  f.type = "bandpass";
  f.frequency.setValueAtTime(200, t);
  f.frequency.exponentialRampToValueAtTime(1800, t + dur * 0.4);
  f.frequency.exponentialRampToValueAtTime(120, t + dur);
  f.Q.value = 1.2;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f);
  f.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/**
 * Dying phone speaker → recovery → portal whoosh.
 * Front-loaded so the glitch feels attached to the real screen.
 */
function startRiftAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return () => {};

  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const end = now + TUNE_MS / 1000;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.9, now + 0.05);
  master.gain.setValueAtTime(0.9, end - 0.85);
  master.gain.exponentialRampToValueAtTime(0.0001, end);
  master.connect(ctx.destination);

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = makeNoiseBuffer(ctx, 2.5);
  noiseSrc.loop = true;
  const noiseBp = ctx.createBiquadFilter();
  noiseBp.type = "bandpass";
  noiseBp.frequency.value = 2100;
  noiseBp.Q.value = 0.85;
  const noiseGain = ctx.createGain();
  // Stuttering speaker death, then thin residual into the rift
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.5, now + 0.02);
  noiseGain.gain.setValueAtTime(0.5, now + 0.1);
  noiseGain.gain.linearRampToValueAtTime(0.04, now + 0.22);
  noiseGain.gain.linearRampToValueAtTime(0.62, now + 0.38);
  noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.55);
  noiseGain.gain.linearRampToValueAtTime(0.55, now + 0.85);
  noiseGain.gain.linearRampToValueAtTime(0.05, now + 1.15);
  noiseGain.gain.linearRampToValueAtTime(0.4, now + 1.45);
  noiseGain.gain.linearRampToValueAtTime(0.1, now + 1.9);
  noiseGain.gain.linearRampToValueAtTime(0.28, now + 2.25);
  noiseGain.gain.linearRampToValueAtTime(0.05, now + 2.7);
  noiseGain.gain.linearRampToValueAtTime(0.12, now + 3.4);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, end);
  noiseSrc.connect(noiseBp);
  noiseBp.connect(noiseGain);
  noiseGain.connect(master);

  // Tinny midrange phone speaker hum that browns out
  const hum = ctx.createOscillator();
  hum.type = "triangle";
  hum.frequency.setValueAtTime(124, now);
  hum.frequency.linearRampToValueAtTime(68, now + 2.2);
  const humGain = ctx.createGain();
  humGain.gain.setValueAtTime(0.0001, now);
  humGain.gain.exponentialRampToValueAtTime(0.09, now + 0.04);
  humGain.gain.linearRampToValueAtTime(0.015, now + 1.9);
  humGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
  hum.connect(humGain);
  humGain.connect(master);

  // Haptic thumps during the malfunction
  [0.06, 0.28, 0.52, 0.78, 1.05, 1.38, 1.72, 2.1, 2.45].forEach((offset, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(52 + i * 3, now + offset);
    o.frequency.exponentialRampToValueAtTime(24, now + offset + 0.09);
    g.gain.setValueAtTime(0.0001, now + offset);
    g.gain.exponentialRampToValueAtTime(0.2 + (i % 3 === 0 ? 0.08 : 0), now + offset + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.11);
    o.connect(g);
    g.connect(master);
    o.start(now + offset);
    o.stop(now + offset + 0.14);
  });

  // Error chirps / reconnect beeps
  [
    [0.18, 1600, 0.028],
    [0.42, 2400, 0.022],
    [0.45, 780, 0.045],
    [0.9, 1900, 0.03],
    [1.25, 520, 0.055],
    [1.7, 2100, 0.02],
    [2.2, 980, 0.04],
    [2.55, 2600, 0.018],
  ].forEach(([t, freq, dur]) => {
    beep(ctx, master, { t: now + t, freq, dur, gain: 0.055 });
  });

  // Portal whoosh when the rift opens
  whoosh(ctx, master, now + 2.55, 0.7, 0.18);
  whoosh(ctx, master, now + 4.35, 0.85, 0.14);

  const drone = ctx.createOscillator();
  drone.type = "sawtooth";
  drone.frequency.setValueAtTime(38, now + 2.2);
  drone.frequency.linearRampToValueAtTime(62, now + 4.2);
  drone.frequency.linearRampToValueAtTime(34, end);
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.setValueAtTime(120, now + 2.2);
  droneFilter.frequency.linearRampToValueAtTime(260, now + 4.4);
  droneFilter.frequency.linearRampToValueAtTime(80, end);
  droneFilter.Q.value = 6;
  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0.0001, now);
  droneGain.gain.setValueAtTime(0.0001, now + 2.15);
  droneGain.gain.exponentialRampToValueAtTime(0.13, now + 2.7);
  droneGain.gain.setValueAtTime(0.13, end - 0.8);
  droneGain.gain.exponentialRampToValueAtTime(0.0001, end);
  drone.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(master);

  const rift = ctx.createOscillator();
  rift.type = "sine";
  rift.frequency.setValueAtTime(98, now + 2.4);
  rift.frequency.exponentialRampToValueAtTime(380, now + 4.5);
  rift.frequency.exponentialRampToValueAtTime(920, now + 6.0);
  const riftGain = ctx.createGain();
  riftGain.gain.setValueAtTime(0.0001, now);
  riftGain.gain.setValueAtTime(0.0001, now + 2.3);
  riftGain.gain.exponentialRampToValueAtTime(0.08, now + 2.8);
  riftGain.gain.linearRampToValueAtTime(0.14, now + 4.3);
  riftGain.gain.exponentialRampToValueAtTime(0.0001, end);
  rift.connect(riftGain);
  riftGain.connect(master);

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  noiseSrc.start();
  hum.start();
  drone.start();
  rift.start();

  const nodes = [noiseSrc, hum, drone, rift];

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

function startGlassAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return () => {};

  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.78, now + 0.012);
  master.gain.setValueAtTime(0.78, now + 0.32);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 4.45);
  master.connect(ctx.destination);

  const nodes = [];
  const noise = makeNoiseBuffer(ctx, 1.2);
  [
    { offset: 0, frequency: 950, gain: 0.72, duration: 0.42 },
    { offset: 0.075, frequency: 2600, gain: 0.48, duration: 0.31 },
    { offset: 0.24, frequency: 3900, gain: 0.28, duration: 0.23 },
  ].forEach(({ offset, frequency, gain, duration }) => {
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const level = ctx.createGain();
    source.buffer = noise;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(frequency, now + offset);
    filter.Q.value = frequency > 2000 ? 1.5 : 0.7;
    level.gain.setValueAtTime(0.0001, now + offset);
    level.gain.exponentialRampToValueAtTime(gain, now + offset + 0.008);
    level.gain.exponentialRampToValueAtTime(
      0.0001,
      now + offset + duration
    );
    source.connect(filter);
    filter.connect(level);
    level.connect(master);
    source.start(now + offset);
    source.stop(now + offset + duration + 0.03);
    nodes.push(source);
  });

  const impact = ctx.createOscillator();
  const impactGain = ctx.createGain();
  impact.type = "sine";
  impact.frequency.setValueAtTime(72, now);
  impact.frequency.exponentialRampToValueAtTime(24, now + 0.24);
  impactGain.gain.setValueAtTime(0.0001, now);
  impactGain.gain.exponentialRampToValueAtTime(0.55, now + 0.008);
  impactGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  impact.connect(impactGain);
  impactGain.connect(master);
  impact.start(now);
  impact.stop(now + 0.35);
  nodes.push(impact);

  // Irregular ice fractures: short filtered-noise impulses only. Avoid pitched
  // oscillators here—they read as bird chirps on phone speakers.
  [
    [0.018, 5200, 0.2, 0.085, -0.55],
    [0.052, 3100, 0.24, 0.12, 0.45],
    [0.11, 6900, 0.13, 0.055, 0.2],
    [0.19, 4300, 0.18, 0.075, -0.3],
    [0.31, 7600, 0.1, 0.045, 0.65],
    [0.47, 2600, 0.16, 0.095, -0.7],
    [0.68, 6100, 0.12, 0.06, 0.35],
    [0.94, 3500, 0.13, 0.08, -0.15],
    [1.27, 7200, 0.085, 0.045, 0.72],
    [1.61, 2900, 0.1, 0.07, -0.45],
  ].forEach(([offset, frequency, gain, duration, pan]) => {
    const source = ctx.createBufferSource();
    const highpass = ctx.createBiquadFilter();
    const peak = ctx.createBiquadFilter();
    const level = ctx.createGain();
    const panner =
      typeof ctx.createStereoPanner === "function"
        ? ctx.createStereoPanner()
        : null;
    source.buffer = noise;
    source.playbackRate.value = 0.82 + (frequency % 1100) / 2100;
    highpass.type = "highpass";
    highpass.frequency.value = Math.max(900, frequency * 0.42);
    highpass.Q.value = 0.62;
    peak.type = "peaking";
    peak.frequency.value = frequency;
    peak.Q.value = 2.8;
    peak.gain.value = 7;
    level.gain.setValueAtTime(0.0001, now + offset);
    level.gain.exponentialRampToValueAtTime(gain, now + offset + 0.0015);
    level.gain.exponentialRampToValueAtTime(
      Math.max(0.018, gain * 0.18),
      now + offset + duration * 0.28
    );
    level.gain.exponentialRampToValueAtTime(
      0.0001,
      now + offset + duration
    );
    source.connect(highpass);
    highpass.connect(peak);
    peak.connect(level);
    if (panner) {
      panner.pan.value = pan;
      level.connect(panner);
      panner.connect(master);
    } else {
      level.connect(master);
    }
    source.start(now + offset);
    source.stop(now + offset + duration + 0.02);
    nodes.push(source);
  });

  whoosh(ctx, master, now + 1.18, 1.35, 0.16);
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  return () => {
    nodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        /* ignore */
      }
    });
    ctx.close().catch(() => {});
  };
}

function GlassShatter({ rootRef, finishOnce, impact }) {
  const ox = Number.isFinite(impact?.xPct) ? impact.xPct : 50;
  const oy = Number.isFinite(impact?.yPct) ? impact.yPct : 43;
  // Crack art is authored around viewBox (50, 43); shift so it blooms at the tap.
  const crackShiftX = ox - 50;
  const crackShiftY = oy - 43;

  return (
    <div
      ref={rootRef}
      className="glass-transition"
      role="presentation"
      aria-hidden="true"
      style={{
        "--glass-transition-dur": `${TUNE_MS}ms`,
        "--glass-ox": `${ox}%`,
        "--glass-oy": `${oy}%`,
      }}
      onAnimationEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.animationName === "glass-transition-hold"
        ) {
          finishOnce();
        }
      }}
    >
      <div className="glass-impact-core" />
      <div className="glass-shockwave" />
      <div className="glass-transition-flash" />
      <svg
        className="glass-cracks"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <g transform={`translate(${crackShiftX} ${crackShiftY})`}>
          <g className="glass-crack-lines">
            <path d="M50 43 L34 26 L23 17 L11 0" />
            <path d="M50 43 L52 24 L61 12 L64 0" />
            <path d="M50 43 L71 31 L85 29 L100 20" />
            <path d="M50 43 L70 49 L84 61 L100 64" />
            <path d="M50 43 L61 64 L58 81 L66 100" />
            <path d="M50 43 L43 65 L31 81 L28 100" />
            <path d="M50 43 L30 48 L15 60 L0 58" />
            <path d="M50 43 L35 36 L17 38 L0 31" />
            <path d="M34 26 L42 18 L39 8" />
            <path d="M71 31 L77 17 L91 9" />
            <path d="M70 49 L77 42 L94 43" />
            <path d="M43 65 L49 76 L45 89" />
            <path d="M30 48 L20 43 L12 48" />
            <path d="M23 17 L18 24 L7 20" />
            <path d="M52 24 L45 16 L49 4" />
            <path d="M61 12 L72 8 L78 0" />
            <path d="M85 29 L82 38 L96 35" />
            <path d="M84 61 L91 73 L100 77" />
            <path d="M61 64 L70 70 L73 87" />
            <path d="M58 81 L52 90 L54 100" />
            <path d="M31 81 L19 87 L13 100" />
            <path d="M15 60 L9 70 L0 72" />
            <path d="M17 38 L11 47 L0 45" />
          </g>
          <g className="glass-impact-rings">
            <circle cx="50" cy="43" r="3.5" />
            <circle cx="50" cy="43" r="8" />
          </g>
          <g className="glass-impact-fractures">
            <path d="M50 43 l-2.2 -5.4 l-1.1 2.1 l-3.8 -4.7" />
            <path d="M50 43 l3.1 -5.1 l1.2 2.4 l4.8 -3.2" />
            <path d="M50 43 l5.6 -1.1 l-1.7 2.2 l5.8 1.8" />
            <path d="M50 43 l4.3 4.2 l-2.5 0.2 l3.2 5.4" />
            <path d="M50 43 l0.2 5.7 l-1.9 -1.4 l-1.1 6.1" />
            <path d="M50 43 l-4.8 3.3 l0.4 -2.4 l-6 1.2" />
            <path d="M50 43 l-5.8 -0.8 l2 -1.7 l-5.3 -3" />
            <path d="M50 43 l-3.7 -4.1 l2.4 0.1 l-2.1 -5.5" />
          </g>
        </g>
      </svg>

      <div className="glass-shard-field">
        {GLASS_SHARDS.map((shard, index) => (
          <i
            key={shard.clip}
            className="glass-piece"
            style={{
              "--piece-clip": shard.clip,
              "--piece-x": `${shard.x}vw`,
              "--piece-y": `${shard.y}vh`,
              "--piece-r": `${shard.r}deg`,
              "--piece-rx": `${index % 2 ? 48 + index * 3 : -42 - index * 2}deg`,
              "--piece-ry": `${index % 3 ? -34 - index * 2 : 46 + index * 2}deg`,
              "--piece-scale": `${0.9 + (index % 4) * 0.055}`,
              "--piece-delay": `${shard.d}ms`,
              "--piece-z": index % 2 ? `${70 + index * 5}px` : `${-55 - index * 4}px`,
            }}
          />
        ))}
      </div>
      <div className="glass-splinter-field">
        {GLASS_SPLINTERS.map((piece, index) => (
          <i
            key={`${piece.x}-${piece.y}-${index}`}
            style={{
              "--splinter-x": `${piece.x}vw`,
              "--splinter-y": `${piece.y}vh`,
              "--splinter-r": `${piece.r}deg`,
              "--splinter-delay": `${piece.d}ms`,
              "--splinter-w": `${piece.w}vmin`,
              "--splinter-h": `${piece.h}vmin`,
            }}
          />
        ))}
      </div>

      <div className="glass-world-reveal">
        <img
          src={UD_LABEL_BRAND.whiteTransparent}
          alt=""
          width={96}
          height={96}
        />
        <span>UNDISCLOSED</span>
        <small>RESEARCH CATALOG</small>
      </div>
      <div className="glass-transition-vignette" />
    </div>
  );
}

/**
 * WellPept → Undisclosed unlock:
 * phone glass fractures from the 5th brand tap, then falls away.
 */
export default function ChannelTuneOverlay({ active, impact, onReveal, onDone }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;
  const finishedRef = useRef(false);
  const revealedRef = useRef(false);
  const rootRef = useRef(null);

  function finishOnce() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (!revealedRef.current) {
      revealedRef.current = true;
      onRevealRef.current?.();
    }
    try {
      rootRef.current?.classList.add("is-done");
    } catch {
      /* ignore */
    }
    onDoneRef.current?.();
  }

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
        stopAudio = startGlassAudio();
      } catch {
        stopAudio = () => {};
      }
    }

    try {
      if (!reduced && navigator.vibrate) {
        navigator.vibrate([55, 18, 110, 24, 180, 34, 280]);
      }
    } catch {
      /* ignore */
    }

    const revealAt = reduced ? 40 : REVEAL_MS;
    const doneAt = reduced ? REDUCED_MS : TUNE_MS;

    const revealTimer = window.setTimeout(() => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      onRevealRef.current?.();
    }, revealAt);

    const doneTimer = window.setTimeout(() => {
      stopAudio();
      try {
        navigator.vibrate?.(0);
      } catch {
        /* ignore */
      }
      finishOnce();
    }, doneAt);

    // Hard failsafe — never leave an invisible full-screen blocker up
    const failsafeTimer = window.setTimeout(() => {
      stopAudio();
      finishOnce();
    }, doneAt + 800);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(failsafeTimer);
      stopAudio();
      try {
        navigator.vibrate?.(0);
      } catch {
        /* ignore */
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <GlassShatter rootRef={rootRef} finishOnce={finishOnce} impact={impact} />
  );

  /* Legacy rift markup retained below temporarily for reference. */
  /* c8 ignore start */
  return (
    <div
      ref={rootRef}
      className="tv-tune tv-tune--rift tv-tune--phone-fault"
      role="presentation"
      aria-hidden="true"
      style={{ "--tv-tune-dur": `${TUNE_MS}ms` }}
      onAnimationEnd={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.animationName !== "tv-tune-hold") return;
        finishOnce();
      }}
    >
      {/* Starts clear so the real WellPept page glitches underneath */}
      <div className="tv-tune-cover" />

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
              values="0.55;1.35;0.45;1.15;0.8"
              dur="0.18s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0"
          />
        </filter>
        <filter id="tv-warp-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.015"
            numOctaves="2"
            result="warp"
          >
            <animate
              attributeName="baseFrequency"
              values="0.012;0.04;0.018;0.035;0.012"
              dur="0.9s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="warp"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      {/* 1. Live-page display meltdown */}
      <div className="phone-fault" aria-hidden="true">
        <div className="phone-fault-shake">
          <div className="phone-fault-chroma" />
          <div className="phone-fault-pixels" />
          <div className="phone-fault-rgb">
            <span className="phone-fault-rgb-r" />
            <span className="phone-fault-rgb-g" />
            <span className="phone-fault-rgb-b" />
          </div>
          <div className="phone-fault-roll" />
          <div className="phone-fault-tears">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="phone-fault-deadzones">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="phone-fault-invert" />
          <div className="phone-fault-flash" />
          <div className="phone-fault-black" />
          <div className="phone-fault-hud">
            <p className="phone-fault-hud-err">DISPLAY FAULT</p>
            <p className="phone-fault-hud-sub">recovering signal…</p>
            <p className="phone-fault-hud-code">0x7E · FRAME DESYNC</p>
            <p className="phone-fault-hud-bar">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </p>
          </div>
        </div>
      </div>

      <div className="tv-tune-screen tv-tune-screen--rift">
        <div className="tv-tune-void" />

        <div className="tv-tune-noise tv-tune-noise--rift" />
        <div className="tv-tune-scanlines" />
        <div className="rift-warp" aria-hidden="true" />

        <div className="rift-ticker" aria-hidden="true">
          <div className="rift-ticker-track">
            <span>
              FDA GATEKEEPERS · BIG PHARMA · FOLLOW THE MONEY · ASK QUESTIONS ·
              PEPTIDE TRUTH · YOUR BODY YOUR DATA · HUMAN RIGHT · TAKE CONTROL ·
              THEY PROFIT · YOU RESEARCH · UNDISCLOSED ·
            </span>
            <span>
              FDA GATEKEEPERS · BIG PHARMA · FOLLOW THE MONEY · ASK QUESTIONS ·
              PEPTIDE TRUTH · YOUR BODY YOUR DATA · HUMAN RIGHT · TAKE CONTROL ·
              THEY PROFIT · YOU RESEARCH · UNDISCLOSED ·
            </span>
          </div>
        </div>

        <div className="rift-mark rift-mark--from">
          <img src="/wp-monogram.svg" alt="" width={120} height={120} />
          <span>WELLPEPT</span>
        </div>

        <div className="rift-portal" aria-hidden="true">
          <div className="rift-portal-marble" />
          <div className="rift-portal-core" />
          <div className="rift-portal-flare" />
          <div className="rift-portal-ring" />
          <div className="rift-portal-ring rift-portal-ring--delay" />
          <div className="rift-portal-ring rift-portal-ring--outer" />
          <div className="rift-shatter">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="rift-embers" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className="rift-mark rift-mark--to">
          <img src={UD_LABEL_BRAND.whiteTransparent} alt="" width={120} height={120} />
          <span>UNDISCLOSED</span>
          <p className="rift-manifesto">Take control of your health.</p>
          <p className="rift-manifesto-sub">It&apos;s your human right.</p>
        </div>

        <div className="tv-tune-vignette" />
        <div className="tv-tune-cut" />
      </div>
    </div>
  );
  /* c8 ignore stop */
}
