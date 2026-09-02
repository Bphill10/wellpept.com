import React, { useEffect, useRef, useState } from "react";
import { labelSVGFromFields } from "../utils/udSilverLabel";
import {
  drawVialScene,
  silverVialBaseSrc,
  prepareVialScene,
  paintVialScene,
} from "../utils/udVialComposite";

/** Black-marble studio scene the catalog vials are composited onto. */
const VIAL_SCENE_SRC = "/ud-labels/bg/vial_card_bg.webp";

// Hover turntable: a full revolution every ~7s, and a quick ease back to the front on leave.
const SPIN_SPEED = 1 / 7000; // label-u per ms
const RETURN_SPEED = 1 / 520; // label-u per ms (ease back to front)
const HOVER_INTENT_MS = 120; // ignore vials the cursor just sweeps past

/**
 * Storefront vial with the live silver catalog label wrapped on it. Renders lazily (only
 * when scrolled near the viewport) so a full product grid stays fast. Works for every
 * product — no per-product image needed — using the product's name, strength, size, form,
 * and powder colour.
 *
 * On hover (desktop, fine pointer, motion allowed) the vial slowly turns so the whole label
 * wraps past — QR side, brand rail, and back to the front — then eases back to rest. The
 * crisp still is snapshotted so leaving restores it instantly; the spin composites at a small
 * resolution so one turning vial stays smooth. Only the hovered vial animates.
 */
export default function CatalogVial({
  name = "Peptide",
  mg = "",
  unit = "mg",
  vialMl = 3,
  form = "",
  powderColor = "",
  className = "",
}) {
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  // Spin machinery (refs so re-renders don't restart the loop).
  const fieldsRef = useRef(null);   // { svg, ml, baseSrc } for the current product
  const stillRef = useRef(null);    // offscreen crisp snapshot for instant restore
  const sceneRef = useRef(null);    // low-res prepared scene state (built on first hover)
  const buildingRef = useRef(null); // in-flight build promise (avoid double build)
  const rafRef = useRef(0);
  const rotRef = useRef(0);
  const modeRef = useRef("idle");   // idle | spin | return
  const lastTsRef = useRef(0);
  const intentRef = useRef(0);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "220px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;

    // Reset any prior spin state (product/fields changed).
    cancelAnimationFrame(rafRef.current);
    window.clearTimeout(intentRef.current);
    modeRef.current = "idle";
    sceneRef.current = null;
    buildingRef.current = null;
    stillRef.current = null;

    const ml = Number(vialMl) >= 8 ? 10 : 3;
    const { svg } = labelSVGFromFields({
      name: name || "Peptide",
      mass: mg != null && mg !== "" ? String(mg) : "",
      unit: unit || "mg",
      labelType: "CATALOG",
      // Clean form for the label — never the vendor pack code (e.g. "· 30mg*10vials").
      formText: /\bB\s*12\b|VITAMIN\s*B12/i.test(`${name} ${form}`) ? "LIQUID" : "LYOPHILIZED POWDER",
      storageTemp: "36–46°F",
      vialMl: ml,
    });
    const baseSrc = silverVialBaseSrc(name, ml, powderColor);
    fieldsRef.current = { svg, ml, baseSrc };

    drawVialScene(canvas, { svg, vialMl: ml, baseSrc, sceneSrc: VIAL_SCENE_SRC, ss: 1.2, maxOut: 820 })
      .then(() => {
        if (cancelled) return;
        setReady(true);
        // Snapshot the crisp still so leaving the hover restores it instantly.
        try {
          const snap = document.createElement("canvas");
          snap.width = canvas.width;
          snap.height = canvas.height;
          snap.getContext("2d").drawImage(canvas, 0, 0);
          stillRef.current = snap;
        } catch (_) { /* tainted/unsupported: skip snapshot, restore re-renders instead */ }
      })
      .catch((err) => console.error("Catalog vial render failed", err));
    return () => { cancelled = true; };
  }, [visible, name, mg, unit, vialMl, form, powderColor]);

  // Restore the crisp still (snapshot if we have it, else re-render).
  const restoreStill = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snap = stillRef.current;
    if (snap) {
      canvas.width = snap.width;
      canvas.height = snap.height;
      canvas.getContext("2d").drawImage(snap, 0, 0);
    } else if (fieldsRef.current) {
      const { svg, ml, baseSrc } = fieldsRef.current;
      drawVialScene(canvas, { svg, vialMl: ml, baseSrc, sceneSrc: VIAL_SCENE_SRC, ss: 1.2, maxOut: 820 }).catch(() => {});
    }
  };

  const step = (ts) => {
    const canvas = canvasRef.current;
    const state = sceneRef.current;
    if (!canvas || !state) return;
    const dt = Math.min(48, ts - (lastTsRef.current || ts));
    lastTsRef.current = ts;
    if (modeRef.current === "spin") {
      rotRef.current = (rotRef.current + dt * SPIN_SPEED) % 1;
      paintVialScene(canvas, state, rotRef.current, { wrap: true });
      rafRef.current = requestAnimationFrame(step);
    } else if (modeRef.current === "return") {
      let r = rotRef.current;
      const target = r > 0.5 ? 1 : 0; // ease to the nearest front
      const move = Math.sign(target - r) * Math.min(Math.abs(target - r), dt * RETURN_SPEED);
      r += move;
      if (Math.abs(target - r) < 0.004) {
        modeRef.current = "idle";
        restoreStill();
      } else {
        rotRef.current = r % 1;
        paintVialScene(canvas, state, (r % 1 + 1) % 1, { wrap: true });
        rafRef.current = requestAnimationFrame(step);
      }
    }
  };

  const ensureSceneState = () => {
    if (sceneRef.current) return Promise.resolve(sceneRef.current);
    if (buildingRef.current) return buildingRef.current;
    const f = fieldsRef.current;
    if (!f) return Promise.resolve(null);
    buildingRef.current = prepareVialScene({
      svg: f.svg, vialMl: f.ml, baseSrc: f.baseSrc, sceneSrc: VIAL_SCENE_SRC,
      ss: 0.42, maxOut: 520,
    }).then((st) => { sceneRef.current = st; return st; })
      .catch(() => null);
    return buildingRef.current;
  };

  const onEnter = () => {
    if (typeof window === "undefined") return;
    const mm = window.matchMedia;
    if (mm?.("(prefers-reduced-motion: reduce)")?.matches) return;
    if (!mm?.("(pointer: fine)")?.matches) return;
    if (!ready) return;
    window.clearTimeout(intentRef.current);
    // Hover intent: only spin if the cursor lingers (don't build for a quick sweep-past).
    intentRef.current = window.setTimeout(async () => {
      const st = await ensureSceneState();
      if (!st) return;
      lastTsRef.current = 0;
      modeRef.current = "spin";
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(step);
    }, HOVER_INTENT_MS);
  };

  const onLeave = () => {
    window.clearTimeout(intentRef.current);
    if (modeRef.current === "spin") {
      modeRef.current = "return"; // ease back to front, then restore the crisp still
    } else if (modeRef.current !== "return") {
      restoreStill();
    }
  };

  // Touch devices have no hover — auto-spin the vial while it sits near the centre of the
  // viewport (one at a time as you scroll), so the rotation is visible on phones too. Fine
  // pointers use hover instead; reduced-motion opts out.
  useEffect(() => {
    if (!visible || !ready) return undefined;
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return undefined;
    const mm = window.matchMedia;
    if (mm?.("(prefers-reduced-motion: reduce)")?.matches) return undefined;
    if (mm?.("(pointer: fine)")?.matches) return undefined; // desktop uses hover
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const centered = entries.some((e) => e.isIntersecting);
        if (centered) {
          ensureSceneState().then((st) => {
            if (!st || modeRef.current === "spin") return;
            lastTsRef.current = 0;
            modeRef.current = "spin";
            cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(step);
          });
        } else if (modeRef.current === "spin") {
          modeRef.current = "return";
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0.01 }
    );
    io.observe(canvas);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ready]);

  // Stop everything on unmount.
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    window.clearTimeout(intentRef.current);
  }, []);

  // 10 mL vials are physically larger than 3 mL — render them bigger so the size reads true.
  const isTenMl = Number(vialMl) >= 8;
  return (
    <canvas
      ref={canvasRef}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className={`${className} silver-label-vial${isTenMl ? " silver-label-vial--10ml" : ""}${ready ? " is-ready" : ""}`.trim()}
      aria-label={`${name || "Peptide"} Undisclosed ${isTenMl ? "10 mL" : "3 mL"} vial`}
    />
  );
}
