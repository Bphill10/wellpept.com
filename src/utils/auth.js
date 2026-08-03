/** WellPept account auth (email + user id + password, 18+, email confirm). */

const USERS_KEY = "wellpept_users_v1";
const SESSION_KEY = "wellpept_session_v1";
const PENDING_KEY = "wellpept_pending_verify_v1";
const SESSION_DAYS = 30;
const VERIFY_HOURS = 48;
export const AUTH_NOTIFY_EMAIL = "info@wellpept.com";

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64ToBuf(b64) {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) bytes[i] = s.charCodeAt(i);
  return bytes.buffer;
}

function randomToken(bytes = 24) {
  return bufToB64(crypto.getRandomValues(new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomCode() {
  const n = crypto.getRandomValues(new Uint8Array(3));
  const num = ((n[0] << 16) | (n[1] << 8) | n[2]) % 1000000;
  return String(num).padStart(6, "0");
}

async function deriveKey(password, saltB64) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: b64ToBuf(saltB64),
      iterations: 120000,
      hash: "SHA-256",
    },
    baseKey,
    256
  );
  return bufToB64(bits);
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalizeUserId(userId) {
  return String(userId || "")
    .trim()
    .toLowerCase();
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function validateEmail(email) {
  const e = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function validateUserId(userId) {
  const id = normalizeUserId(userId);
  return /^[a-z0-9_]{3,24}$/.test(id);
}

export function validatePassword(password) {
  const p = String(password || "");
  if (p.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) {
    return "Password must include at least one letter and one number.";
  }
  return "";
}

function isVerified(user) {
  // New accounts require emailVerified === true.
  // Legacy accounts created before this gate stay usable.
  if (user.emailVerified === true) return true;
  if (user.emailVerified === false) return false;
  return Boolean(user.createdAt && !user.verifyToken);
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.userId || !session?.expiresAt) return null;
    if (Date.now() > Number(session.expiresAt)) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    const users = loadUsers();
    const user = users.find((u) => u.userId === session.userId);
    if (user && !isVerified(user)) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function writeSession(user) {
  const session = {
    userId: user.userId,
    email: user.email,
    emailVerified: true,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getPendingVerify() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw);
    if (!pending?.email || !pending?.userId) return null;
    return pending;
  } catch {
    return null;
  }
}

function setPendingVerify(user) {
  const pending = {
    email: user.email,
    userId: user.userId,
    createdAt: Date.now(),
  };
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  return pending;
}

export function clearPendingVerify() {
  localStorage.removeItem(PENDING_KEY);
}

function issueVerification(user) {
  const verifyToken = randomToken(24);
  const verifyCode = randomCode();
  const verifyExpiresAt = Date.now() + VERIFY_HOURS * 60 * 60 * 1000;
  user.verifyToken = verifyToken;
  user.verifyCode = verifyCode;
  user.verifyExpiresAt = verifyExpiresAt;
  user.emailVerified = false;
  user.emailVerifiedAt = null;
  return { verifyToken, verifyCode, verifyExpiresAt };
}

export function buildConfirmUrl(token) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set("confirm_email", token);
  return url.toString();
}

export async function openConfirmEmailDraft(user, { verifyToken, verifyCode } = {}) {
  const token = verifyToken || user.verifyToken;
  const code = verifyCode || user.verifyCode;
  if (!token || !code) return null;
  const link = buildConfirmUrl(token);
  const textBody = [
    "Confirm your WellPept account email.",
    "",
    `User ID: ${user.userId}`,
    `Confirmation code: ${code}`,
    "",
    "Open this link on the same device/browser where you signed up:",
    link,
    "",
    "Or sign in and enter the 6-digit code on the confirmation screen.",
    "",
    "If you did not create a WellPept account, ignore this message.",
  ].join("\n");

  try {
    const { fetchEmailConfig, sendTransactionalEmail, openMailto } = await import(
      "./emailClient"
    );
    const cfg = await fetchEmailConfig();
    if (cfg?.enabled) {
      await sendTransactionalEmail({
        type: "auth_confirm",
        to: user.email,
        userId: user.userId,
        code,
        link,
      });
      return { via: "resend", link, code };
    }
    const mailto = openMailto({
      to: user.email,
      subject: "Confirm your WellPept email",
      body: textBody,
    });
    return { via: "mailto", mailto, link, code };
  } catch {
    try {
      const { openMailto } = await import("./emailClient");
      const mailto = openMailto({
        to: user.email,
        subject: "Confirm your WellPept email",
        body: textBody,
      });
      return { via: "mailto", mailto, link, code };
    } catch {
      return { via: "none", link, code };
    }
  }
}

async function notifyOpsNewSignup(user) {
  try {
    const { fetchEmailConfig, sendTransactionalEmail } = await import(
      "./emailClient"
    );
    const cfg = await fetchEmailConfig();
    if (!cfg?.enabled) return { ok: false, via: "skipped" };
    await sendTransactionalEmail({
      type: "ops_signup",
      userId: user.userId,
      email: user.email,
      createdAt: user.createdAt,
    });
    return { ok: true, via: "resend" };
  } catch (err) {
    return { ok: false, error: err?.message };
  }
}

export async function registerAccount({
  email,
  userId,
  password,
  confirmPassword,
  ageConfirmed,
  payout = null,
}) {
  if (!ageConfirmed) {
    return { ok: false, error: "You must confirm you are 18 or older." };
  }
  if (!validateEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!validateUserId(userId)) {
    return {
      ok: false,
      error: "User ID must be 3 to 24 characters: letters, numbers, underscore.",
    };
  }
  const pwError = validatePassword(password);
  if (pwError) return { ok: false, error: pwError };
  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  const users = loadUsers();
  const id = normalizeUserId(userId);
  const mail = normalizeEmail(email);
  if (users.some((u) => u.userId === id)) {
    return { ok: false, error: "That user ID is already taken." };
  }
  if (users.some((u) => u.email === mail)) {
    return { ok: false, error: "An account with that email already exists." };
  }

  const salt = bufToB64(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await deriveKey(password, salt);
  const user = {
    userId: id,
    email: mail,
    salt,
    hash,
    ageConfirmed: true,
    emailVerified: false,
    createdAt: new Date().toISOString(),
  };
  const issued = issueVerification(user);
  users.push(user);
  saveUsers(users);
  logout();
  const pending = setPendingVerify(user);
  const draft = await openConfirmEmailDraft(user, issued);
  // Fire-and-forget ops ping when Resend is configured
  notifyOpsNewSignup(user);

  // VIP allowlist: mint dual codes + save payout destination at signup
  try {
    const { isAllowlisted, ensureVipMember, saveReferralPayout, hasPayoutDestination } =
      await import("./referralCodes.js");
    if (isAllowlisted(mail)) {
      ensureVipMember(mail);
      if (payout && hasPayoutDestination(payout)) {
        saveReferralPayout(mail, payout);
      }
    }
  } catch {
    /* referral module optional at signup */
  }

  return {
    ok: true,
    needsEmailConfirm: true,
    pending,
    confirmLink: draft?.link || buildConfirmUrl(issued.verifyToken),
    confirmCode: issued.verifyCode,
    emailVia: draft?.via || "none",
  };
}

export async function loginAccount({ login, password }) {
  const key = String(login || "")
    .trim()
    .toLowerCase();
  if (!key || !password) {
    return { ok: false, error: "Enter your user ID or email and password." };
  }
  const users = loadUsers();
  const user = users.find((u) => u.userId === key || u.email === key);
  if (!user) {
    return { ok: false, error: "Account not found." };
  }
  const hash = await deriveKey(password, user.salt);
  if (hash !== user.hash) {
    return { ok: false, error: "Incorrect password." };
  }
  if (!user.ageConfirmed) {
    return { ok: false, error: "This account is not cleared for 18+ access." };
  }
  if (!isVerified(user)) {
    // Refresh token if expired so they can confirm again
    if (!user.verifyExpiresAt || Date.now() > Number(user.verifyExpiresAt)) {
      issueVerification(user);
      saveUsers(users);
    }
    setPendingVerify(user);
    const draft = await openConfirmEmailDraft(user);
    return {
      ok: false,
      needsEmailConfirm: true,
      error:
        draft?.via === "resend"
          ? "Confirm your email before signing in. We sent a confirmation message. Enter the 6-digit code or open the link."
          : "Confirm your email before signing in. We opened a confirmation message. Send it to yourself, then use the link or 6-digit code.",
      pending: getPendingVerify(),
      confirmCode: user.verifyCode,
      confirmLink: buildConfirmUrl(user.verifyToken),
      emailVia: draft?.via || "none",
    };
  }
  const session = writeSession(user);
  clearPendingVerify();
  return { ok: true, session };
}

function markVerified(user, users) {
  user.emailVerified = true;
  user.emailVerifiedAt = new Date().toISOString();
  user.verifyToken = null;
  user.verifyCode = null;
  user.verifyExpiresAt = null;
  saveUsers(users);
  clearPendingVerify();
  return writeSession(user);
}

export function confirmEmailWithToken(token) {
  const t = String(token || "").trim();
  if (!t) return { ok: false, error: "Missing confirmation link." };
  const users = loadUsers();
  const user = users.find((u) => u.verifyToken && u.verifyToken === t);
  if (!user) {
    return { ok: false, error: "This confirmation link is invalid or already used." };
  }
  if (user.verifyExpiresAt && Date.now() > Number(user.verifyExpiresAt)) {
    return {
      ok: false,
      error: "This confirmation link expired. Sign in to get a new one.",
      needsEmailConfirm: true,
      pending: setPendingVerify(user),
    };
  }
  const session = markVerified(user, users);
  return { ok: true, session };
}

export function confirmEmailWithCode({ email, userId, code }) {
  const entered = String(code || "")
    .trim()
    .replace(/\s+/g, "");
  if (!/^\d{6}$/.test(entered)) {
    return { ok: false, error: "Enter the 6-digit confirmation code." };
  }
  const users = loadUsers();
  const pending = getPendingVerify();
  const mail = normalizeEmail(email || pending?.email);
  const id = normalizeUserId(userId || pending?.userId);
  const user = users.find(
    (u) => (mail && u.email === mail) || (id && u.userId === id)
  );
  if (!user) {
    return { ok: false, error: "Account not found. Create an account first." };
  }
  if (isVerified(user)) {
    const session = writeSession(user);
    clearPendingVerify();
    return { ok: true, session, alreadyVerified: true };
  }
  if (user.verifyExpiresAt && Date.now() > Number(user.verifyExpiresAt)) {
    return {
      ok: false,
      error: "That code expired. Use Resend confirmation to get a new one.",
    };
  }
  if (user.verifyCode !== entered) {
    return { ok: false, error: "Incorrect confirmation code." };
  }
  const session = markVerified(user, users);
  return { ok: true, session };
}

export async function resendEmailConfirmation({ email, userId } = {}) {
  const users = loadUsers();
  const pending = getPendingVerify();
  const mail = normalizeEmail(email || pending?.email);
  const id = normalizeUserId(userId || pending?.userId);
  const user = users.find(
    (u) => (mail && u.email === mail) || (id && u.userId === id)
  );
  if (!user) {
    return { ok: false, error: "Account not found." };
  }
  if (isVerified(user)) {
    return { ok: false, error: "This email is already confirmed. Sign in." };
  }
  const issued = issueVerification(user);
  saveUsers(users);
  setPendingVerify(user);
  const draft = await openConfirmEmailDraft(user, issued);
  return {
    ok: true,
    pending: getPendingVerify(),
    confirmLink: draft?.link,
    confirmCode: issued.verifyCode,
    emailVia: draft?.via || "none",
  };
}

/** Consume ?confirm_email= from the URL if present. */
export function consumeConfirmEmailFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("confirm_email");
    if (!token) return null;
    params.delete("confirm_email");
    const next = `${window.location.pathname}${
      params.toString() ? `?${params}` : ""
    }${window.location.hash || ""}`;
    window.history.replaceState({}, "", next);
    return confirmEmailWithToken(token);
  } catch {
    return { ok: false, error: "Could not read confirmation link." };
  }
}
