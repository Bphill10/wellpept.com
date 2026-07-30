/**
 * Proxy STG / Google Sheet CSV pulls (avoids browser CORS).
 *
 * GET /api/stg-sheet?url=https://docs.google.com/spreadsheets/d/.../export?format=csv
 * Env fallback: STG_PRICE_SHEET_CSV_URL
 */

function allowedHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return (
    host === "docs.google.com" ||
    host === "spreadsheets.google.com" ||
    host.endsWith(".googleusercontent.com") ||
    host === "raw.githubusercontent.com"
  );
}

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  Object.entries({
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  }).forEach(([k, v]) => res.setHeader(k, v));
  res.end(body);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    send(res, 405, "Method not allowed");
    return;
  }

  const q = req.query?.url || req.query?.sheet;
  const fromEnv = process.env.STG_PRICE_SHEET_CSV_URL || "";
  const raw = String(q || fromEnv || "").trim();
  if (!raw) {
    send(
      res,
      400,
      "Missing url. Pass ?url= or set STG_PRICE_SHEET_CSV_URL."
    );
    return;
  }

  let target;
  try {
    target = new URL(raw);
  } catch {
    send(res, 400, "Invalid url");
    return;
  }
  if (target.protocol !== "https:" || !allowedHost(target.hostname)) {
    send(res, 400, "Host not allowed");
    return;
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { Accept: "text/csv,text/plain,*/*" },
      redirect: "follow",
    });
    const text = await upstream.text();
    if (!upstream.ok) {
      send(res, upstream.status, text.slice(0, 500) || "Upstream error");
      return;
    }
    send(res, 200, text, {
      "Content-Type":
        upstream.headers.get("content-type") || "text/csv; charset=utf-8",
    });
  } catch (err) {
    send(res, 502, err?.message || "Fetch failed");
  }
}
