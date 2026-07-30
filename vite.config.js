import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Local /api middleware so Stripe + Chargebee work in `vite`/`vite preview`
 * the same way they do on Vercel serverless.
 */
function paymentsLocalApiPlugin(env) {
  return {
    name: "wellpept-payments-api",
    configureServer(server) {
      attachApi(server, env);
    },
    configurePreviewServer(server) {
      attachApi(server, env);
    },
  };
}

function attachApi(server, env) {
  for (const [key, value] of Object.entries(env)) {
    if (value != null && process.env[key] == null) process.env[key] = value;
  }

  const root = path.resolve(".");

  async function runHandler(fileName, req, res) {
    const fileUrl = pathToFileURL(path.join(root, "api", fileName)).href;
    const mod = await import(`${fileUrl}?t=${Date.now()}`);
    const handler = mod.default;
    await handler(req, res);
  }

  const routes = {
    "/api/payment-config": "payment-config.js",
    "/api/create-payment-intent": "create-payment-intent.js",
    "/api/chargebee-config": "chargebee-config.js",
    "/api/chargebee-checkout": "chargebee-checkout.js",
    "/api/chargebee-portal": "chargebee-portal.js",
    "/api/email-config": "email-config.js",
    "/api/send-email": "send-email.js",
  };

  server.middlewares.use(async (req, res, next) => {
    const url = req.url?.split("?")[0] || "";
    const file = routes[url];
    if (!file) {
      next();
      return;
    }
    try {
      await runHandler(file, req, res);
    } catch (err) {
      console.error("Local payments API error", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err?.message || "API error" }));
    }
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), paymentsLocalApiPlugin(env)],
  };
});
