import { useState } from "react";

const AGE_KEY = "wellpept_age_ok_v1";

export function hasAgeClearance() {
  try {
    return localStorage.getItem(AGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistAgeClearance() {
  try {
    localStorage.setItem(AGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * Site-wide 18+ gate. Blocks browsing until confirmed; remembered locally.
 */
export default function AgeGate({ brand = "WellPept", onClear }) {
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");

  function confirm() {
    if (!checked) {
      setError("Confirm you are 18 or older to continue.");
      return;
    }
    persistAgeClearance();
    onClear?.();
  }

  function decline() {
    setError("");
    window.location.href = "https://www.google.com";
  }

  return (
    <div className="auth-gate age-gate" role="dialog" aria-modal="true" aria-labelledby="age-gate-title">
      <div className="auth-gate-bg" aria-hidden="true" />
      <div className="auth-card age-gate-card">
        <p className="auth-kicker">{brand}</p>
        <h1 id="age-gate-title">Age verification</h1>
        <p className="auth-lead">
          You must be 18 or older to enter this site. {brand} products are for
          adults for personal cosmetic use on intact skin only — not for
          injection, ingestion, or medical use.
        </p>

        <label className="auth-check">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
              setError("");
            }}
          />
          <span>I confirm that I am 18 years of age or older.</span>
        </label>

        {error ? <p className="auth-error">{error}</p> : null}

        <div className="age-gate-actions">
          <button type="button" className="primary-btn" onClick={confirm}>
            Enter
          </button>
          <button type="button" className="ghost-btn" onClick={decline}>
            I am under 18
          </button>
        </div>
      </div>
    </div>
  );
}
