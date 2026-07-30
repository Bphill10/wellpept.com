import { useEffect, useState } from "react";
import {
  confirmEmailWithCode,
  consumeConfirmEmailFromUrl,
  getPendingVerify,
  loginAccount,
  registerAccount,
  resendEmailConfirmation,
  validateEmail,
  validatePassword,
  validateUserId,
} from "../utils/auth";

export default function AuthGate({ onAuthed, onClose }) {
  const [mode, setMode] = useState("signup"); // signup | login | confirm
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(() => getPendingVerify());
  const [confirmLink, setConfirmLink] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const result = consumeConfirmEmailFromUrl();
    if (!result) return;
    if (result.ok && result.session) {
      onAuthed?.(result.session);
      return;
    }
    setMode("confirm");
    if (result.pending) setPending(result.pending);
    setError(result.error || "Could not confirm email from this link.");
  }, [onAuthed]);

  useEffect(() => {
    if (pending) setMode("confirm");
  }, [pending]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "confirm") {
        const result = confirmEmailWithCode({
          email: pending?.email || email,
          userId: pending?.userId || userId,
          code,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onAuthed?.(result.session);
        return;
      }

      if (mode === "signup") {
        const result = await registerAccount({
          email,
          userId,
          password,
          confirmPassword,
          ageConfirmed,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (result.needsEmailConfirm) {
          setPending(result.pending);
          setConfirmLink(result.confirmLink || "");
          setMode("confirm");
          setInfo(
            result.emailVia === "resend"
              ? "Account created. We emailed you a confirmation code — enter it below or open the link in that message."
              : "Account created. Confirm your email before shopping — we opened a message to your inbox. Send it, then enter the 6-digit code or open the link."
          );
          return;
        }
        onAuthed?.(result.session);
        return;
      }

      const result = await loginAccount({ login, password });
      if (!result.ok) {
        if (result.needsEmailConfirm) {
          setPending(result.pending || getPendingVerify());
          setConfirmLink(result.confirmLink || "");
          setMode("confirm");
          setInfo(
            result.emailVia === "resend"
              ? "Confirm your email before signing in. Check your inbox for the code or confirmation link."
              : "Confirm your email before signing in. Send the confirmation message, then enter the code or open the link."
          );
          setError("");
          return;
        }
        setError(result.error);
        return;
      }
      onAuthed?.(result.session);
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const result = await resendEmailConfirmation({
        email: pending?.email || email,
        userId: pending?.userId || userId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPending(result.pending);
      setConfirmLink(result.confirmLink || "");
      setInfo(
        result.emailVia === "resend"
          ? "New confirmation email sent. Enter the new 6-digit code from your inbox."
          : "New confirmation message opened. Send it to your email, then enter the new 6-digit code."
      );
    } finally {
      setBusy(false);
    }
  }

  const pwHint = password ? validatePassword(password) : "";
  const pendingEmail = pending?.email || email;

  return (
    <div className="auth-gate">
      <div className="auth-gate-bg" aria-hidden="true" />
      <div className="auth-card">
        {onClose && (
          <button
            type="button"
            className="auth-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        )}
        <img
          src="/wp-monogram.svg"
          alt="WellPept"
          className="auth-mark"
          width={72}
          height={72}
        />
        <p className="auth-kicker">WellPept</p>
        <h1>
          {mode === "confirm"
            ? "Confirm your email"
            : mode === "signup"
              ? "Create your account"
              : "Sign in"}
        </h1>
        <p className="auth-lead">
          {mode === "confirm"
            ? "Confirm your email to save an account across visits. You can still browse and request orders without an account."
            : "Optional account for a saved profile. You can browse and submit order requests as a guest."}
        </p>

        {mode !== "confirm" && (
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "signup" ? "is-on" : ""}
              onClick={() => {
                setMode("signup");
                setError("");
                setInfo("");
              }}
            >
              Create account
            </button>
            <button
              type="button"
              className={mode === "login" ? "is-on" : ""}
              onClick={() => {
                setMode("login");
                setError("");
                setInfo("");
              }}
            >
              Sign in
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "confirm" ? (
            <>
              <p className="auth-pending-email">
                Confirming <strong>{pendingEmail || "your email"}</strong>
                {pending?.userId ? (
                  <>
                    {" "}
                    · ID <strong>{pending.userId}</strong>
                  </>
                ) : null}
              </p>
              <label>
                6-digit confirmation code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  required
                />
              </label>
              {!pendingEmail && (
                <label>
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                  />
                </label>
              )}
            </>
          ) : mode === "signup" ? (
            <>
              <label>
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                />
              </label>
              <label>
                User ID
                <input
                  type="text"
                  autoComplete="username"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="letters, numbers, underscore"
                  required
                />
                {userId && !validateUserId(userId) && (
                  <span className="auth-field-hint">
                    3 to 24 characters: a to z, 0 to 9, underscore
                  </span>
                )}
              </label>
            </>
          ) : (
            <label>
              User ID or email
              <input
                type="text"
                autoComplete="username"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="your user ID or email"
                required
              />
            </label>
          )}

          {mode !== "confirm" && (
            <label>
              Password
              <input
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="at least 8 characters"
                required
              />
              {mode === "signup" && pwHint && (
                <span className="auth-field-hint">{pwHint}</span>
              )}
            </label>
          )}

          {mode === "signup" && (
            <>
              <label>
                Confirm password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </label>
              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                />
                <span>
                  I confirm I am 18 years of age or older and will use WellPept
                  products for personal cosmetic use only.
                </span>
              </label>
            </>
          )}

          {info && <p className="auth-info">{info}</p>}
          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="primary-btn auth-submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "confirm"
                ? "Confirm email and enter"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
          </button>
        </form>

        {mode === "confirm" && (
          <div className="auth-confirm-actions">
            <button type="button" className="soft-btn" onClick={handleResend}>
              Resend confirmation email
            </button>
            {confirmLink && (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(confirmLink);
                    setInfo("Confirmation link copied. Open it on this device.");
                  } catch {
                    setInfo(confirmLink);
                  }
                }}
              >
                Copy confirmation link
              </button>
            )}
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setMode("login");
                setError("");
                setInfo("");
              }}
            >
              Back to sign in
            </button>
          </div>
        )}

        <p className="auth-legal">
          By continuing you agree to WellPept product notices. Contact{" "}
          <a href="mailto:info@wellpept.com">info@wellpept.com</a>.
        </p>
        {mode === "signup" && email && !validateEmail(email) && (
          <p className="auth-field-hint">Enter a valid email address.</p>
        )}
      </div>
    </div>
  );
}
