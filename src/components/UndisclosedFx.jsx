import { useEffect, useMemo, useRef } from "react";

/**
 * Ambient "special effects" layer for the Undisclosed shell:
 *  - a soft spotlight that follows the cursor over the black marble,
 *  - slow-drifting light motes for atmosphere,
 *  - scroll-reveal (cards fade/rise in as they enter the viewport),
 *  - a subtle 3D tilt on each vial card toward the cursor.
 * All motion is gated behind prefers-reduced-motion; pointer effects behind a fine pointer.
 * Everything is additive and self-cleaning, so if JS is unavailable the page is unaffected.
 */
export default function UndisclosedFx() {
  const spotRef = useRef(null);

  // Stable random motes (computed once).
  const motes = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: `${(i * 61) % 100}%`,
        size: 2 + ((i * 7) % 4),
        delay: `${-(i * 1.7) % 20}s`,
        dur: `${16 + ((i * 5) % 14)}s`,
        drift: `${((i % 5) - 2) * 3}vw`,
        opacity: 0.12 + ((i % 4) * 0.05),
      })),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mm = window.matchMedia;
    const reduced = mm?.("(prefers-reduced-motion: reduce)")?.matches;
    const fine = mm?.("(pointer: fine)")?.matches;
    const cleanups = [];

    // --- cursor spotlight (desktop) ---
    if (fine && spotRef.current) {
      const el = spotRef.current;
      let raf = 0;
      const onMove = (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          el.style.setProperty("--sx", `${e.clientX}px`);
          el.style.setProperty("--sy", `${e.clientY}px`);
          el.style.opacity = "1";
        });
      };
      const onLeave = () => { el.style.opacity = "0"; };
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onMove, { passive: true });
      document.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onMove);
        document.removeEventListener("mouseleave", onLeave);
        if (raf) cancelAnimationFrame(raf);
      });
    }

    // --- scroll reveal ---
    if (!reduced && "IntersectionObserver" in window) {
      const shell = document.querySelector(".app-shell--undisclosed");
      const cards = shell ? shell.querySelectorAll(".product-card") : [];
      if (cards.length) {
        shell.classList.add("fx-reveal-on");
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((en) => {
              if (en.isIntersecting) {
                en.target.classList.add("is-revealed");
                io.unobserve(en.target);
              }
            });
          },
          { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
        );
        cards.forEach((c) => io.observe(c));
        cleanups.push(() => {
          io.disconnect();
          shell.classList.remove("fx-reveal-on");
          cards.forEach((c) => c.classList.remove("is-revealed"));
        });
      }
    }

    // --- 3D vial tilt (desktop) ---
    if (fine && !reduced) {
      const shell = document.querySelector(".app-shell--undisclosed");
      if (shell) {
        const onMove = (e) => {
          const card = e.target.closest?.(".product-card");
          if (!card) return;
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          card.style.setProperty("--tilt-x", `${(py * -5).toFixed(2)}deg`);
          card.style.setProperty("--tilt-y", `${(px * 7).toFixed(2)}deg`);
        };
        const onOut = (e) => {
          const card = e.target.closest?.(".product-card");
          if (!card) return;
          card.style.setProperty("--tilt-x", "0deg");
          card.style.setProperty("--tilt-y", "0deg");
        };
        shell.addEventListener("pointermove", onMove, { passive: true });
        shell.addEventListener("pointerout", onOut, { passive: true });
        cleanups.push(() => {
          shell.removeEventListener("pointermove", onMove);
          shell.removeEventListener("pointerout", onOut);
        });
      }
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <>
      <div ref={spotRef} className="ud-spotlight" aria-hidden="true" />
      <div className="ud-motes" aria-hidden="true">
        {motes.map((m, i) => (
          <i
            key={i}
            style={{
              left: m.left,
              width: `${m.size}px`,
              height: `${m.size}px`,
              "--mote-peak": m.opacity,
              "--mote-delay": m.delay,
              "--mote-dur": m.dur,
              "--mote-drift": m.drift,
            }}
          />
        ))}
      </div>
    </>
  );
}
