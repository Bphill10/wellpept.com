import { useEffect, useRef } from "react";

const TUNE_MS = 7800;
const REVEAL_MS = 4200; // Undisclosed mounts under solid cover before fade
const REDUCED_MS = 160;

function makeNoiseBuffer(ctx, seconds = 2) {
  const buffer = ctx.createBuffer(
    1,
    Math.floor(ctx.sampleRate * seconds),
    ctx.sampleRate
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const n = Math.random() * 2 - 1;
    const crackle = Math.random() > 0.992 ? (Math.random() * 2 - 1) * 1.8 : 0;
    // Soft digital bit-crush bursts
    const crush = Math.random() > 0.997 ? Math.sign(n) * 0.95 : 0;
    data[i] = n * 0.55 + crackle + crush;
  }
  return buffer;
}

function beep(ctx, master, { t, freq = 880, dur = 0.04, gain = 0.08, type = "square" }) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
  return o;
}

/**
 * Phone speaker death rattle → low portal drone.
 * Early hits feel like a dying display / haptic stutter.
 */
function startRiftAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return () => {};

  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const end = now + TUNE_MS / 1000;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.85, now + 0.08);
  master.gain.setValueAtTime(0.85, end - 0.7);
  master.gain.exponentialRampToValueAtTime(0.0001, end);
  master.connect(ctx.destination);

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = makeNoiseBuffer(ctx, 2);
  noiseSrc.loop = true;
  const noiseBp = ctx.createBiquadFilter();
  noiseBp.type = "bandpass";
  noiseBp.frequency.value = 1800;
  noiseBp.Q.value = 0.7;
  const noiseGain = ctx.createGain();
  // Front-loaded phone-speaker hash, then settles
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.42, now + 0.03);
  noiseGain.gain.setValueAtTime(0.42, now + 0.12);
  noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.28);
  noiseGain.gain.linearRampToValueAtTime(0.55, now + 0.42);
  noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.7);
  noiseGain.gain.linearRampToValueAtTime(0.48, now + 1.05);
  noiseGain.gain.linearRampToValueAtTime(0.1, now + 1.5);
  noiseGain.gain.linearRampToValueAtTime(0.35, now + 1.85);
  noiseGain.gain.linearRampToValueAtTime(0.06, now + 2.3);
  noiseGain.gain.linearRampToValueAtTime(0.14, now + 3.2);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, end);
  noiseSrc.connect(noiseBp);
  noiseBp.connect(noiseGain);
  noiseGain.connect(master);

  // Tinny phone speaker hum
  const hum = ctx.createOscillator();
  hum.type = "triangle";
  hum.frequency.setValueAtTime(118, now);
  const humGain = ctx.createGain();
  humGain.gain.setValueAtTime(0.0001, now);
  humGain.gain.exponentialRampToValueAtTime(0.07, now + 0.05);
  humGain.gain.linearRampToValueAtTime(0.02, now + 1.8);
  humGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
  hum.connect(humGain);
  humGain.connect(master);

  // Haptic-like thumps during the malfunction
  const thumpTimes = [0.08, 0.35, 0.62, 0.95, 1.28, 1.7, 2.05];
  thumpTimes.forEach((offset, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(55 + i * 4, now + offset);
    o.frequency.exponentialRampToValueAtTime(28, now + offset + 0.08);
    g.gain.setValueAtTime(0.0001, now + offset);
    g.gain.exponentialRampToValueAtTime(0.22, now + offset + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.12);
    o.connect(g);
    g.connect(master);
    o.start(now + offset);
    o.stop(now + offset + 0.15);
  });

  // Error chirps / reconnect beeps
  [
    [0.2, 1400, 0.03],
    [0.48, 2200, 0.025],
    [0.5, 900, 0.04],
    [1.1, 1800, 0.03],
    [1.55, 600, 0.05],
    [2.15, 2400, 0.02],
  ].forEach(([t, freq, dur]) => {
    beep(ctx, master, { t: now + t, freq, dur, gain: 0.06 });
  });

  const drone = ctx.createOscillator();
  drone.type = "sawtooth";
  drone.frequency.setValueAtTime(42, now + 2.0);
  drone.frequency.linearRampToValueAtTime(58, now + 3.8);
  drone.frequency.linearRampToValueAtTime(36, end);
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.setValueAtTime(140, now + 2.0);
  droneFilter.frequency.linearRampToValueAtTime(220, now + 4.0);
  droneFilter.frequency.linearRampToValueAtTime(90, end);
  droneFilter.Q.value = 5;
  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0.0001, now);
  droneGain.gain.setValueAtTime(0.0001, now + 1.9);
  droneGain.gain.exponentialRampToValueAtTime(0.11, now + 2.5);
  droneGain.gain.setValueAtTime(0.11, end - 0.7);
  droneGain.gain.exponentialRampToValueAtTime(0.0001, end);
  drone.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(master);

  const rift = ctx.createOscillator();
  rift.type = "sine";
  rift.frequency.setValueAtTime(110, now + 2.2);
  rift.frequency.exponentialRampToValueAtTime(440, now + 4.2);
  rift.frequency.exponentialRampToValueAtTime(880, now + 5.6);
  const riftGain = ctx.createGain();
  riftGain.gain.setValueAtTime(0.0001, now);
  riftGain.gain.setValueAtTime(0.0001, now + 2.1);
  riftGain.gain.exponentialRampToValueAtTime(0.07, now + 2.6);
  riftGain.gain.linearRampToValueAtTime(0.12, now + 4.0);
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

/**
 * WellPept → Undisclosed unlock:
 * phone display malfunction → monogram collapses into a marble rift → Undisclosed.
 */
export default function ChannelTuneOverlay({ active, onReveal, onDone }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;
  const finishedRef = useRef(false);
  const revealedRef = useRef(false);

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
        stopAudio = startRiftAudio();
      } catch {
        stopAudio = () => {};
      }
    }

    // Mild device vibration during the malfunction (phones that support it)
    try {
      if (!reduced && navigator.vibrate) {
        navigator.vibrate([40, 30, 80, 40, 30, 120, 50, 40, 200]);
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
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (!revealedRef.current) {
        revealedRef.current = true;
        onRevealRef.current?.();
      }
      stopAudio();
      try {
        navigator.vibrate?.(0);
      } catch {
        /* ignore */
      }
      onDoneRef.current?.();
    }, doneAt);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
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
    <div
      className="tv-tune tv-tune--rift tv-tune--phone-fault"
      role="presentation"
      aria-hidden="true"
      style={{ "--tv-tune-dur": `${TUNE_MS}ms` }}
    >
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

      {/* 1. Phone display meltdown */}
      <div className="phone-fault" aria-hidden="true">
        <div className="phone-fault-shake">
          <div className="phone-fault-freeze" />
          <div className="phone-fault-pixels" />
          <div className="phone-fault-rgb">
            <span className="phone-fault-rgb-r" />
            <span className="phone-fault-rgb-g" />
            <span className="phone-fault-rgb-b" />
          </div>
          <div className="phone-fault-tears">
            <span /><span /><span /><span /><span />
          </div>
          <div className="phone-fault-deadzones">
            <span /><span /><span />
          </div>
          <div className="phone-fault-invert" />
          <div className="phone-fault-flash" />
          <div className="phone-fault-black" />
          <div className="phone-fault-hud">
            <p className="phone-fault-hud-err">DISPLAY FAULT</p>
            <p className="phone-fault-hud-sub">recovering signal…</p>
            <p className="phone-fault-hud-code">0x7E · FRAME DESYNC</p>
          </div>
        </div>
      </div>

      <div className="tv-tune-screen tv-tune-screen--rift">
        <div className="tv-tune-void" />

        <div className="tv-tune-noise tv-tune-noise--rift" />
        <div className="tv-tune-scanlines" />

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
          <div className="rift-portal-ring" />
          <div className="rift-portal-ring rift-portal-ring--delay" />
          <div className="rift-shatter">
            <span /><span /><span /><span /><span /><span />
          </div>
        </div>

        <div className="rift-mark rift-mark--to">
          <img src="/ud-monogram.svg" alt="" width={120} height={120} />
          <span>UNDISCLOSED</span>
          <p className="rift-manifesto">Take control of your health.</p>
          <p className="rift-manifesto-sub">It&apos;s your human right.</p>
        </div>

        <div className="tv-tune-vignette" />
        <div className="tv-tune-cut" />
      </div>
    </div>
  );
}
