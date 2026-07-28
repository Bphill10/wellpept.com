import { useState } from "react";
import {
  loginAccount,
  registerAccount,
  validateEmail,
  validatePassword,
  validateUserId,
} from "../utils/auth";

export default function AuthGate({ onAuthed }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
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
        onAuthed?.(result.session);
        return;
      }
      const result = await loginAccount({ login, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onAuthed?.(result.session);
    } finally {
      setBusy(false);
    }
  }

  const pwHint = password ? validatePassword(password) : "";

  return (
    <div className="auth-gate">
      <div className="auth-gate-bg" aria-hidden="true" />
      <div className="auth-card">
        <img
          src="/wp-monogram.svg"
          alt="WellPept"
          className="auth-mark"
          width={72}
          height={72}
        />
        <p className="auth-kicker">WellPept</p>
        <h1>{mode === "signup" ? "Create your account" : "Sign in"}</h1>
        <p className="auth-lead">
          Account required to shop Fresh Mix. You must be 18 or older. We need your
          email, a user ID, and a password.
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "signup" ? "is-on" : ""}
            onClick={() => {
              setMode("signup");
              setError("");
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
            }}
          >
            Sign in
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" ? (
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

          <label>
            Password
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 8 characters"
              required
            />
            {mode === "signup" && pwHint && (
              <span className="auth-field-hint">{pwHint}</span>
            )}
          </label>

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
                  I confirm I am 18 years of age or older and will use WellPept products
                  for personal cosmetic use only.
                </span>
              </label>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="primary-btn auth-submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

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
