import { useEffect, useRef } from "react";

const TUNE_MS = 6800;
const REVEAL_MS = 3600; // Undisclosed mounts under solid cover before fade
const REDUCED_MS = 160;

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
 * Faulty CRT crackle → low portal drone → brief spark hits.
 */
function startRiftAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return () => {};

  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const end = now + TUNE_MS / 1000;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.8, now + 0.12);
  master.gain.setValueAtTime(0.8, end - 0.65);
  master.gain.exponentialRampToValueAtTime(0.0001, end);
  master.connect(ctx.destination);

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = makeNoiseBuffer(ctx, 2);
  noiseSrc.loop = true;
  const noiseHp = ctx.createBiquadFilter();
  noiseHp.type = "highpass";
  noiseHp.frequency.value = 280;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.26, now + 0.04);
  noiseGain.gain.linearRampToValueAtTime(0.34, now + 0.35);
  noiseGain.gain.linearRampToValueAtTime(0.06, now + 1.15);
  noiseGain.gain.linearRampToValueAtTime(0.14, now + 2.6);
  noiseGain.gain.linearRampToValueAtTime(0.08, now + 4.4);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, end);
  noiseSrc.connect(noiseHp);
  noiseHp.connect(noiseGain);
  noiseGain.connect(master);

  const drone = ctx.createOscillator();
  drone.type = "sawtooth";
  drone.frequency.setValueAtTime(42, now);
  drone.frequency.linearRampToValueAtTime(58, now + 2.2);
  drone.frequency.linearRampToValueAtTime(36, end);
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.setValueAtTime(140, now);
  droneFilter.frequency.linearRampToValueAtTime(220, now + 2.5);
  droneFilter.frequency.linearRampToValueAtTime(90, end);
  droneFilter.Q.value = 5;
  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0.0001, now);
  droneGain.gain.exponentialRampToValueAtTime(0.1, now + 1.1);
  droneGain.gain.setValueAtTime(0.1, end - 0.7);
  droneGain.gain.exponentialRampToValueAtTime(0.0001, end);
  drone.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(master);

  // Rising rift tone
  const rift = ctx.createOscillator();
  rift.type = "sine";
  rift.frequency.setValueAtTime(110, now + 1.2);
  rift.frequency.exponentialRampToValueAtTime(440, now + 3.4);
  rift.frequency.exponentialRampToValueAtTime(880, now + 4.8);
  const riftGain = ctx.createGain();
  riftGain.gain.setValueAtTime(0.0001, now);
  riftGain.gain.exponentialRampToValueAtTime(0.07, now + 1.4);
  riftGain.gain.linearRampToValueAtTime(0.11, now + 3.2);
  riftGain.gain.exponentialRampToValueAtTime(0.0001, end);
  rift.connect(riftGain);
  riftGain.connect(master);

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  noiseSrc.start();
  drone.start();
  rift.start();

  const nodes = [noiseSrc, drone, rift];

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
 * faulty flicker/sparks → monogram collapses into a marble rift → Undisclosed blooms through.
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
      className="tv-tune tv-tune--rift"
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

      {/* 1. Faulty screen on/off + sparks */}
      <div className="tv-tune-fault" aria-hidden="true">
        <div className="tv-tune-fault-black" />
        <div className="tv-tune-fault-snow" />
        <div className="tv-tune-spark tv-tune-spark--a" />
        <div className="tv-tune-spark tv-tune-spark--b" />
        <div className="tv-tune-spark tv-tune-spark--c" />
      </div>

      <div className="tv-tune-screen tv-tune-screen--rift">
        <div className="tv-tune-void" />

        {/* Light static bed (kept subtle — portal is the star) */}
        <div className="tv-tune-noise tv-tune-noise--rift" />
        <div className="tv-tune-scanlines" />

        {/* Conspiracy signal crawl during the rift */}
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

        {/* 2. WellPept monogram → collapses into the rift */}
        <div className="rift-mark rift-mark--from">
          <img src="/wp-monogram.svg" alt="" width={120} height={120} />
          <span>WELLPEPT</span>
        </div>

        {/* 3. Black-marble portal bloom */}
        <div className="rift-portal" aria-hidden="true">
          <div className="rift-portal-marble" />
          <div className="rift-portal-core" />
          <div className="rift-portal-ring" />
          <div className="rift-portal-ring rift-portal-ring--delay" />
          <div className="rift-shatter">
            <span /><span /><span /><span /><span /><span />
          </div>
        </div>

        {/* 4. Undisclosed emerges through the rift */}
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
