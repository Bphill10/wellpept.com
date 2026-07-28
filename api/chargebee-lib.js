import Chargebee from "chargebee";

function getSite() {
  return (
    process.env.CHARGEBEE_SITE?.trim() ||
    process.env.VITE_CHARGEBEE_SITE?.trim() ||
    ""
  );
}

function getApiKey() {
  return process.env.CHARGEBEE_API_KEY?.trim() || "";
}

export function chargebeeConfigured() {
  return Boolean(getSite() && getApiKey());
}

export function getChargebeeClient() {
  if (!chargebeeConfigured()) return null;
  return new Chargebee({
    site: getSite(),
    apiKey: getApiKey(),
  });
}

export function originFromReq(req) {
  const proto = req.headers?.["x-forwarded-proto"] || "http";
  const host = req.headers?.["x-forwarded-host"] || req.headers?.host || "localhost:5173";
  return `${proto}://${host}`;
}

export function dollarsToCents(amount) {
  return Math.round(Number(amount) * 100);
}
