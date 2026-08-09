import { useEffect, useRef } from "react";
import { UD_LABEL_BRAND } from "../data/udLabelAssets";

const TUNE_MS = 8200;
const REVEAL_MS = 4500; // Undisclosed mounts under solid cover before fade
const REDUCED_MS = 160;

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

/**
 * WellPept → Undisclosed unlock:
 * live-page glitch → hard blackout → marble rift → Undisclosed.
 */
export default function ChannelTuneOverlay({ active, onReveal, onDone }) {
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
        stopAudio = startRiftAudio();
      } catch {
        stopAudio = () => {};
      }
    }

    try {
      if (!reduced && navigator.vibrate) {
        navigator.vibrate([
          35, 25, 70, 35, 25, 90, 40, 30, 110, 40, 50, 180, 60, 40, 220,
        ]);
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

        <div className="rift-switch-beat" aria-hidden="true">
          <img
            src={`${UD_LABEL_BRAND.mascotSwitchFlip}?v=bulb-eyes-v1`}
            alt=""
            className="rift-switch-mascot"
            width={720}
            height={720}
            decoding="async"
          />
          <p className="rift-switch-caption">POWER · GRID ONLINE</p>
        </div>

        <div className="tv-tune-vignette" />
        <div className="tv-tune-cut" />
      </div>
    </div>
  );
}
