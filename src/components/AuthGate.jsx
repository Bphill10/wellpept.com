import { useEffect, useMemo, useState } from "react";
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
import { siteLegal } from "../data/siteLegal";
import {
  hasPayoutDestination,
  isAllowlisted,
} from "../utils/referralCodes";
import { UD_LABEL_BRAND } from "../data/udLabelAssets";

export default function AuthGate({ onAuthed, onClose, labMode = false }) {
  const legal = siteLegal(labMode);
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
  const [payout, setPayout] = useState({
    method: "venmo",
    venmo: "",
    zelle: "",
    crypto: "",
  });

  const vipSignup = useMemo(
    () => mode === "signup" && validateEmail(email) && isAllowlisted(email),
    [mode, email]
  );

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
        if (vipSignup && !hasPayoutDestination(payout)) {
          setError(
            "Add Venmo, Zelle, or a crypto wallet so we can send your friend-code earnings."
          );
          return;
        }
        const result = await registerAccount({
          email,
          userId,
          password,
          confirmPassword,
          ageConfirmed,
          payout: vipSignup ? payout : null,
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
              ? vipSignup
                ? "Account created. Your 20% code and share code are ready after you confirm. Check your email for the code."
                : "Account created. We emailed you a confirmation code. Enter it below or open the link in that message."
              : vipSignup
                ? "Account created. Confirm your email — then you’ll see your personal 20% code and the share code for friends."
                : "Account created. Confirm your email before shopping. We opened a message to your inbox. Send it, then enter the 6-digit code or open the link."
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
          src={labMode ? UD_LABEL_BRAND.whiteTransparent : "/wp-monogram.svg"}
          alt={labMode ? "Undisclosed" : "WellPept"}
          className={`auth-mark${labMode ? " brand-logo--ud-hex" : ""}`}
          width={72}
          height={72}
        />
        <p className="auth-kicker">{labMode ? "Undisclosed" : "WellPept"}</p>
        <h1>
          {mode === "confirm"
            ? "Confirm your email"
            : mode === "signup"
              ? "Create your account"
              : "Sign in"}
        </h1>
        <p className="auth-lead">
          {mode === "confirm"
            ? "Confirm your email so we can reach you about orders. Browse freely without signing in. You only need an account when you place an order."
            : "Browse freely without signing in. You only need an account when you place an order, so we can send supply updates and your pay link."}
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

              {vipSignup ? (
                <div className="auth-vip-payout">
                  <p className="auth-vip-title">
                    Direct payout (friend-code earnings)
                  </p>
                  <p className="auth-field-hint">
                    You’re on the invite list. You’ll get a personal 20% code and
                    a share code for friends (they get 10% off; you get the other
                    10% after their order is delivered). Where should we send
                    your cut?
                  </p>
                  <label>
                    Payout method
                    <select
                      value={payout.method}
                      onChange={(e) =>
                        setPayout((p) => ({ ...p, method: e.target.value }))
                      }
                    >
                      <option value="venmo">Venmo</option>
                      <option value="zelle">Zelle</option>
                      <option value="crypto">Crypto / USDT</option>
                    </select>
                  </label>
                  {payout.method === "venmo" ? (
                    <label>
                      Venmo handle
                      <input
                        value={payout.venmo}
                        onChange={(e) =>
                          setPayout((p) => ({
                            ...p,
                            venmo: e.target.value.replace(/^@/, ""),
                          }))
                        }
                        placeholder="yourVenmo"
                        required
                      />
                    </label>
                  ) : null}
                  {payout.method === "zelle" ? (
                    <label>
                      Zelle email / phone
                      <input
                        value={payout.zelle}
                        onChange={(e) =>
                          setPayout((p) => ({ ...p, zelle: e.target.value }))
                        }
                        placeholder="you@email.com"
                        required
                      />
                    </label>
                  ) : null}
                  {payout.method === "crypto" ? (
                    <label>
                      Wallet address
                      <input
                        value={payout.crypto}
                        onChange={(e) =>
                          setPayout((p) => ({
                            ...p,
                            crypto: e.target.value.trim(),
                          }))
                        }
                        placeholder="USDT / wallet address"
                        spellCheck={false}
                        required
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}

              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                />
                <span>{legal.signupAck}</span>
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
          {legal.authFooter} Contact{" "}
          <a href="mailto:info@wellpept.com">info@wellpept.com</a>.
        </p>
        {mode === "signup" && email && !validateEmail(email) && (
          <p className="auth-field-hint">Enter a valid email address.</p>
        )}
      </div>
    </div>
  );
}
