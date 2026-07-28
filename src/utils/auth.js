/** WellPept account auth (email + user id + password, 18+). */

const USERS_KEY = "wellpept_users_v1";
const SESSION_KEY = "wellpept_session_v1";
const SESSION_DAYS = 30;

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
    return session;
  } catch {
    return null;
  }
}

function writeSession(user) {
  const session = {
    userId: user.userId,
    email: user.email,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export async function registerAccount({
  email,
  userId,
  password,
  confirmPassword,
  ageConfirmed,
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
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  const session = writeSession(user);
  return { ok: true, session };
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
  const session = writeSession(user);
  return { ok: true, session };
}
